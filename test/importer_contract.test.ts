import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import {
  extractCaptionBlock,
  importPrototypeHtml,
  refineSpecFromRenderEvidence,
} from '../tools/import_prototype_html';

interface PrototypeMapEntry {
  caption: string;
  screenId: string;
  product: string;
  ui: string;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
}

function loadPrototypeMap(repoRoot: string): PrototypeMapEntry[] {
  const mapPath = resolve(repoRoot, 'specs', 'bindings', 'html', 'prototype-map.json');
  const map = readJson<{ screens: PrototypeMapEntry[] }>(mapPath);
  return map.screens;
}

function prepareTempWorkspace(repoRoot: string): string {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fahs-import-'));
  const mapPath = resolve(repoRoot, 'specs', 'bindings', 'html', 'prototype-map.json');
  const htmlPath = resolve(repoRoot, 'fahs_flutter_like_prototype_v2.html');

  mkdirSync(resolve(tempRoot, 'specs', 'ui', 'screens'), { recursive: true });
  mkdirSync(resolve(tempRoot, 'specs', 'product', 'screens'), { recursive: true });
  mkdirSync(resolve(tempRoot, 'specs', 'bindings', 'html'), { recursive: true });

  copyFileSync(mapPath, resolve(tempRoot, 'specs', 'bindings', 'html', 'prototype-map.json'));
  copyFileSync(htmlPath, resolve(tempRoot, 'fahs_flutter_like_prototype_v2.html'));

  for (const screen of loadPrototypeMap(repoRoot)) {
    copyFileSync(resolve(repoRoot, screen.ui), resolve(tempRoot, screen.ui));
    copyFileSync(resolve(repoRoot, screen.product), resolve(tempRoot, screen.product));
  }

  return tempRoot;
}

describe('Importer Contract', () => {
  const repoRoot = resolve(__dirname, '..');
  const prototypeHtmlPath = resolve(repoRoot, 'fahs_flutter_like_prototype_v2.html');
  const prototypeHtml = readFileSync(prototypeHtmlPath, 'utf-8');

  test('every mapped caption exists in the prototype HTML', () => {
    for (const screen of loadPrototypeMap(repoRoot)) {
      expect(extractCaptionBlock(prototypeHtml, screen.caption)).not.toBeNull();
    }
  });

  test('importer writes sourceEvidence and preserves product rules', () => {
    const tempRoot = prepareTempWorkspace(repoRoot);
    const screens = loadPrototypeMap(repoRoot);

    const originalProducts = new Map<string, string>();
    for (const screen of screens) {
      originalProducts.set(screen.screenId, readFileSync(resolve(tempRoot, screen.product), 'utf-8'));

      const uiPath = resolve(tempRoot, screen.ui);
      const uiSpec = readJson<any>(uiPath);
      delete uiSpec.sourceEvidence;
      delete uiSpec.renderEvidence;

      if (screen.screenId === 'home') {
        const ordersSection = uiSpec.layout.regions.body.children.find(
          (child: any) => child.type === 'layout.horizontal' && child.props?.title === 'الطلبات',
        );
        delete ordersSection.props.trailingLabel;
        delete ordersSection.props.display;
        delete ordersSection.children[0].props.repeatCount;
      }

      writeFileSync(uiPath, `${JSON.stringify(uiSpec, null, 2)}\n`, 'utf-8');
    }

    const result = importPrototypeHtml(tempRoot, resolve(tempRoot, 'fahs_flutter_like_prototype_v2.html'));
    expect(result.screensUpdated.sort()).toEqual(screens.map(screen => screen.screenId).sort());
    expect(result.filesWritten.length).toBeGreaterThan(0);
    expect(result.evidenceUsed.length).toBe(screens.length);
    expect(result.changes.some(change => change.field === 'sourceEvidence')).toBe(true);
    expect(result.changes.some(change => change.field === 'renderEvidence')).toBe(true);

    for (const screen of screens) {
      const uiPath = resolve(tempRoot, screen.ui);
      const uiSpec = readJson<any>(uiPath);
      expect(uiSpec.sourceEvidence.htmlCaption).toBe(screen.caption);
      expect(uiSpec.sourceEvidence.screenId).toBe(screen.screenId);
      expect(uiSpec.sourceEvidence.anchors).toEqual(expect.any(Array));
      expect(uiSpec.renderEvidence).toEqual(expect.any(Object));
      expect(uiSpec.renderEvidence.visibleText).toEqual(expect.any(Array));
      expect(uiSpec.refinementLog).toEqual(expect.any(Array));
      expect(
        uiSpec.refinementLog.every((entry: any) =>
          ['raw_html', 'rendered_html'].includes(entry.provenance?.source),
        ),
      ).toBe(true);
      expect(
        uiSpec.refinementLog.every((entry: any) =>
          ['high', 'medium', 'low'].includes(entry.provenance?.confidence),
        ),
      ).toBe(true);

      const uiText = readFileSync(uiPath, 'utf-8');
      expect(uiText).not.toMatch(/\bAppScaffold\b/);
      expect(uiText).not.toMatch(/\bAppBar\b/);
      expect(uiText).not.toMatch(/#[0-9A-Fa-f]{6}/);

      expect(readFileSync(resolve(tempRoot, screen.product), 'utf-8')).toBe(originalProducts.get(screen.screenId));
    }

    const homeSpec = readJson<any>(resolve(tempRoot, 'specs', 'ui', 'screens', 'home.ui.json'));
    expect(homeSpec.sourceEvidence).toEqual({
      htmlCaption: 'Home',
      screenId: 'home',
      anchors: ['.logo-head', '.banner-small', '.order', '.home-card', '.bottom-nav'],
    });
    expect(homeSpec.renderEvidence.selectorCounts['.order']).toBe(2);
    expect(homeSpec.renderEvidence.selectorCounts['.banner-small']).toBe(2);
    expect(homeSpec.renderEvidence.selectorCounts['.home-card']).toBe(2);
    expect(homeSpec.renderEvidence.selectorCounts['.bottom-nav']).toBe(1);
    expect(homeSpec.refinementLog.some((entry: any) => entry.field === 'trailingLabel')).toBe(true);
    expect(homeSpec.refinementLog.some((entry: any) => entry.field === 'repeatCount')).toBe(true);

    const ordersSection = homeSpec.layout.regions.body.children.find(
      (child: any) => child.type === 'layout.horizontal' && child.props?.title === 'الطلبات',
    );
    expect(ordersSection).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          title: 'الطلبات',
          trailingLabel: 'عرض الكل',
          display: 'list',
        }),
      }),
    );
    expect(ordersSection.children[0].props).toEqual(
      expect.objectContaining({
        repeatCount: 2,
      }),
    );
  });

  test('low-confidence repeat mismatch becomes a warning, not an auto-change', () => {
    const uiSpec = {
      screenId: 'synthetic',
      usesProductSpec: 'specs/product/screens/home.product.json',
      layout: {
        type: 'screen',
        regions: {
          body: {
            type: 'layout.vertical',
            children: [
              {
                type: 'component.orderCard',
                repeat: true,
                props: {
                  repeatCount: 3,
                },
              },
            ],
          },
        },
      },
    };

    const renderEvidence = {
      visibleText: ['example'],
      selectorCounts: {},
      repeatedItemCounts: [
        { className: 'order', count: 2, parentClassName: 'list', sampleText: 'one' },
        { className: 'card', count: 2, parentClassName: 'list', sampleText: 'two' },
      ],
      sectionGroups: [],
    };

    const result = refineSpecFromRenderEvidence(uiSpec as any, {
      screenId: 'synthetic',
      caption: 'Synthetic',
      renderEvidence: renderEvidence as any,
    });

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].provenance.confidence).toBe('low');
    expect(result.changes.some(change => change.field === 'repeatCount')).toBe(false);
    expect((uiSpec as any).layout.regions.body.children[0].props.repeatCount).toBe(3);
  });

  test('importer does not change product rules', () => {
    const tempRoot = prepareTempWorkspace(repoRoot);
    const productPath = resolve(tempRoot, 'specs', 'product', 'screens', 'payment.product.json');
    const original = readFileSync(productPath, 'utf-8');
    importPrototypeHtml(tempRoot, resolve(tempRoot, 'fahs_flutter_like_prototype_v2.html'));
    expect(readFileSync(productPath, 'utf-8')).toBe(original);
  });
});
