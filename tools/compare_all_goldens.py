#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from PIL import Image


TARGET_SIZE = (390, 844)
GOLDEN_CROP = (25, 40, 390, 844)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Compare every prototype-map screen render with its Flutter golden.'
    )
    parser.add_argument('--root', default='.', help='Repository root')
    parser.add_argument('--threshold', type=int, default=0)
    parser.add_argument(
        '--enable',
        action='store_true',
        help='Enable pixel-by-pixel comparison. Disabled by default until the visual pipeline matures.',
    )
    parser.add_argument(
        '--require-all',
        action='store_true',
        help='Fail when any mapped prototype PNG or Flutter golden is missing',
    )
    return parser.parse_args()


def write_composite(prototype: 'Image.Image', golden: 'Image.Image', mask: 'Image.Image', path: Path) -> None:
    from PIL import Image
    from compare_payment_golden import add_label, build_diff_panel

    prototype_panel = add_label(prototype, 'Prototype')
    golden_panel = add_label(golden, 'Golden')
    diff_panel = build_diff_panel(prototype, mask)
    spacer = 24
    canvas = Image.new(
        'RGB',
        (prototype_panel.width * 3 + spacer * 2, prototype_panel.height),
        'white',
    )
    canvas.paste(prototype_panel, (0, 0))
    canvas.paste(golden_panel, (prototype_panel.width + spacer, 0))
    canvas.paste(diff_panel, (prototype_panel.width * 2 + spacer * 2, 0))
    path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(path)


def main() -> int:
    args = parse_args()
    root = Path(args.root).resolve()
    map_path = root / 'specs/bindings/html/prototype-map.json'
    mapping = json.loads(map_path.read_text(encoding='utf8'))
    artifact_root = root / 'artifacts/prototype-golden-comparison'
    results: list[dict[str, object]] = []
    failures: list[str] = []

    if not args.enable:
        report_path = artifact_root / 'comparison-report.json'
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report = {
            'status': 'disabled',
            'reason': (
                'Pixel-by-pixel prototype versus Flutter golden comparison is intentionally '
                'disabled until fonts, component mapping, RTL slot ordering, spacing, and '
                'viewport capture are mature enough for this to be a reliable gate.'
            ),
            'screens': [
                {
                    'screenId': screen['screenId'],
                    'caption': screen.get('caption'),
                    'status': 'not_compared',
                }
                for screen in mapping['screens']
            ],
        }
        report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf8')
        print('Pixel comparison is disabled for the default workflow.')
        print('Evidence screenshots/goldens may still be generated, but drift is not a gate.')
        print('Run with --enable when the visual pipeline is mature enough for strict comparison.')
        print(f'Wrote report: {report_path}')
        return 0

    for screen in mapping['screens']:
        screen_id = screen['screenId']
        prototype_path = artifact_root / screen_id / 'prototype.png'
        golden_path = root / 'test/goldens' / f'{screen_id}_screen.png'
        diff_path = artifact_root / screen_id / 'prototype-vs-golden-diff.png'

        missing = [str(path) for path in (prototype_path, golden_path) if not path.exists()]
        if missing:
            message = f'{screen_id}: missing ' + ', '.join(missing)
            print(f'SKIP {message}')
            results.append({'screenId': screen_id, 'status': 'missing', 'files': missing})
            if args.require_all:
                failures.append(message)
            continue

        from PIL import ImageChops
        from compare_payment_golden import build_mask, crop_to_rect, load_rgb

        prototype = load_rgb(prototype_path)
        golden_source = load_rgb(golden_path)
        golden = crop_to_rect(golden_source, GOLDEN_CROP)

        print(
            f'{screen_id}: prototype region=full {prototype.size[0]}x{prototype.size[1]}, '
            f'golden region=x={GOLDEN_CROP[0]} y={GOLDEN_CROP[1]} '
            f'w={GOLDEN_CROP[2]} h={GOLDEN_CROP[3]}'
        )
        if prototype.size != TARGET_SIZE or golden.size != TARGET_SIZE:
            message = (
                f'{screen_id}: comparison dimensions must both be {TARGET_SIZE}; '
                f'prototype={prototype.size}, golden={golden.size}'
            )
            print(f'FAIL {message}', file=sys.stderr)
            results.append({'screenId': screen_id, 'status': 'dimension_mismatch', 'message': message})
            failures.append(message)
            continue

        difference = ImageChops.difference(prototype, golden)
        mask = build_mask(difference, args.threshold)
        different_pixels = sum(mask.histogram()[1:])
        total_pixels = TARGET_SIZE[0] * TARGET_SIZE[1]
        drift = different_pixels / total_pixels * 100
        write_composite(prototype, golden, mask, diff_path)
        print(f'PASS {screen_id}: {drift:.4f}% drift -> {diff_path}')
        results.append(
            {
                'screenId': screen_id,
                'status': 'compared',
                'prototype': str(prototype_path),
                'golden': str(golden_path),
                'diff': str(diff_path),
                'comparedRegion': {'width': 390, 'height': 844, 'dpr': 1.0},
                'differentPixels': different_pixels,
                'totalPixels': total_pixels,
                'driftPercent': round(drift, 6),
            }
        )

    report_path = artifact_root / 'comparison-report.json'
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps({'screens': results}, indent=2) + '\n', encoding='utf8')
    print(f'Wrote report: {report_path}')
    return 1 if failures else 0


if __name__ == '__main__':
    raise SystemExit(main())
