#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import TYPE_CHECKING, Iterable

if TYPE_CHECKING:
    from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Compare the prototype payment render to the Flutter golden.'
    )
    parser.add_argument('--prototype', required=True, help='Path to the prototype screenshot')
    parser.add_argument('--golden', required=True, help='Path to the Flutter golden screenshot')
    parser.add_argument(
        '--diff',
        help='Optional path to write a visual diff composite',
    )
    parser.add_argument(
        '--threshold',
        type=int,
        default=0,
        help='Per-channel pixel difference threshold before a pixel counts as changed',
    )
    parser.add_argument(
        '--max-drift',
        type=float,
        default=None,
        help='Optional maximum allowed percent drift before exiting non-zero',
    )
    parser.add_argument(
        '--enable',
        action='store_true',
        help='Enable pixel-by-pixel comparison. Disabled by default until the visual pipeline matures.',
    )
    parser.add_argument(
        '--crop',
        help='Deprecated shared crop rectangle as x,y,w,h applied to both images',
    )
    parser.add_argument(
        '--prototype-crop',
        help='Prototype crop rectangle as x,y,w,h before normalization',
    )
    parser.add_argument(
        '--golden-crop',
        help='Golden crop rectangle as x,y,w,h before normalization',
    )
    parser.add_argument(
        '--target-size',
        default='390,844',
        help='Canonical comparison size as width,height (default: 390,844)',
    )
    parser.add_argument(
        '--ignore-rect',
        action='append',
        default=[],
        help='Optional rectangle as x,y,w,h to mask out after cropping; may be repeated',
    )
    return parser.parse_args()


def load_rgb(path: Path) -> 'Image.Image':
    from PIL import Image

    return Image.open(path).convert('RGB')


def parse_rect(value: str) -> tuple[int, int, int, int]:
    parts = [part.strip() for part in value.split(',')]
    if len(parts) != 4:
        raise ValueError(f'Invalid rect "{value}", expected x,y,w,h')
    x, y, w, h = (int(part) for part in parts)
    if w <= 0 or h <= 0:
        raise ValueError(f'Invalid rect "{value}", width and height must be positive')
    return x, y, w, h


def parse_size(value: str) -> tuple[int, int]:
    parts = [part.strip() for part in value.split(',')]
    if len(parts) != 2:
        raise ValueError(f'Invalid size "{value}", expected width,height')
    width, height = (int(part) for part in parts)
    if width <= 0 or height <= 0:
        raise ValueError(f'Invalid size "{value}", dimensions must be positive')
    return width, height


def crop_to_rect(image: 'Image.Image', rect: tuple[int, int, int, int]) -> 'Image.Image':
    x, y, w, h = rect
    if x < 0 or y < 0 or x + w > image.width or y + h > image.height:
        raise ValueError(
            f'Crop x={x} y={y} w={w} h={h} exceeds image size {image.size}'
        )
    return image.crop((x, y, x + w, y + h))


def normalize(image: 'Image.Image', target_size: tuple[int, int]) -> 'Image.Image':
    from PIL import Image

    if image.size == target_size:
        return image
    return image.resize(target_size, Image.Resampling.LANCZOS)


def mask_rects(image: 'Image.Image', rects: Iterable[tuple[int, int, int, int]]) -> 'Image.Image':
    from PIL import ImageDraw

    result = image.copy()
    for x, y, w, h in rects:
        ImageDraw.Draw(result).rectangle((x, y, x + w - 1, y + h - 1), fill='white')
    return result


def build_mask(diff: 'Image.Image', threshold: int) -> 'Image.Image':
    gray = diff.convert('L')
    if threshold <= 0:
        return gray.point(lambda value: 255 if value > 0 else 0)
    return gray.point(lambda value: 255 if value > threshold else 0)


def build_diff_panel(prototype: 'Image.Image', mask: 'Image.Image') -> 'Image.Image':
    from PIL import Image, ImageDraw

    width, height = prototype.size
    diff_overlay = Image.new('RGBA', (width, height), (255, 0, 0, 120))
    proto_rgba = prototype.convert('RGBA')
    overlayed = Image.new('RGBA', (width, height), (255, 255, 255, 255))
    overlayed.paste(proto_rgba, (0, 0))
    overlayed.paste(diff_overlay, (0, 0), mask)

    label_h = 36
    pad = 16
    panel_w = width
    panel_h = height + label_h
    panel = Image.new('RGB', (panel_w, panel_h), 'white')
    panel.paste(overlayed.convert('RGB'), (0, label_h))
    draw = ImageDraw.Draw(panel)
    draw.text((pad, 10), 'Prototype + diff', fill='black')
    return panel


def add_label(image: 'Image.Image', label: str) -> 'Image.Image':
    from PIL import Image, ImageDraw

    label_h = 36
    panel = Image.new('RGB', (image.width, image.height + label_h), 'white')
    panel.paste(image, (0, label_h))
    draw = ImageDraw.Draw(panel)
    draw.text((16, 10), label, fill='black')
    return panel


def main() -> int:
    args = parse_args()
    prototype_path = Path(args.prototype)
    golden_path = Path(args.golden)
    diff_path = Path(args.diff) if args.diff else None

    if not args.enable:
        print('Pixel comparison is disabled for the default workflow.')
        print('Evidence screenshots/goldens may still be generated, but drift is not a gate.')
        print('Run with --enable when the visual pipeline is mature enough for strict comparison.')
        if diff_path:
            print(f'Diff image not written while comparison is disabled: {diff_path}')
        return 0

    shared_crop = parse_rect(args.crop) if args.crop else None
    prototype_crop = parse_rect(args.prototype_crop) if args.prototype_crop else shared_crop
    golden_crop = parse_rect(args.golden_crop) if args.golden_crop else shared_crop
    target_size = parse_size(args.target_size)
    ignore_rects = [parse_rect(rect) for rect in args.ignore_rect]

    if not prototype_path.exists():
        print(f'Prototype screenshot missing: {prototype_path}', file=sys.stderr)
        return 2
    if not golden_path.exists():
        print(f'Golden screenshot missing: {golden_path}', file=sys.stderr)
        return 2

    from PIL import Image, ImageChops

    prototype = load_rgb(prototype_path)
    golden = load_rgb(golden_path)

    if prototype_crop is not None:
        print(
            'Prototype source region: '
            f'x={prototype_crop[0]} y={prototype_crop[1]} '
            f'w={prototype_crop[2]} h={prototype_crop[3]}'
        )
        prototype = crop_to_rect(prototype, prototype_crop)
    if golden_crop is not None:
        print(
            'Golden source region: '
            f'x={golden_crop[0]} y={golden_crop[1]} '
            f'w={golden_crop[2]} h={golden_crop[3]}'
        )
        golden = crop_to_rect(golden, golden_crop)

    prototype = normalize(prototype, target_size)
    golden = normalize(golden, target_size)
    print(f'Normalized comparison region: {target_size[0]}x{target_size[1]} at DPR 1.0')

    if prototype.size != golden.size:
        print(
            f'Size mismatch after normalization: prototype={prototype.size} golden={golden.size}',
            file=sys.stderr,
        )
        return 1

    if ignore_rects:
        print(
            'Ignoring rects: '
            + ', '.join(f'x={x} y={y} w={w} h={h}' for x, y, w, h in ignore_rects)
        )
        prototype = mask_rects(prototype, ignore_rects)
        golden = mask_rects(golden, ignore_rects)

    diff = ImageChops.difference(prototype, golden)
    mask = build_mask(diff, args.threshold)
    different_pixels = sum(mask.histogram()[1:])
    total_pixels = prototype.width * prototype.height
    drift_percent = (different_pixels / total_pixels) * 100 if total_pixels else 0.0

    print(
        f'Prototype vs golden drift: {different_pixels}/{total_pixels} pixels '
        f'({drift_percent:.4f}%)'
    )

    if diff_path:
        proto_panel = add_label(prototype, 'Prototype')
        golden_panel = add_label(golden, 'Golden')
        diff_panel = build_diff_panel(prototype, mask)
        row_h = max(proto_panel.height, golden_panel.height, diff_panel.height)
        spacer = 24
        canvas = Image.new(
            'RGB',
            (proto_panel.width * 3 + spacer * 2, row_h),
            'white',
        )
        canvas.paste(proto_panel, (0, 0))
        canvas.paste(golden_panel, (proto_panel.width + spacer, 0))
        canvas.paste(diff_panel, (proto_panel.width * 2 + spacer * 2, 0))
        canvas.save(diff_path)
        print(f'Wrote diff image: {diff_path}')

    if args.max_drift is not None and drift_percent > args.max_drift:
        print(
            f'Drift {drift_percent:.4f}% exceeds max drift {args.max_drift:.4f}%',
            file=sys.stderr,
        )
        return 1

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
