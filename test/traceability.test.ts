import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

interface PrototypeMapEntry {
  caption: string;
  screenId: string;
  product: string;
  ui: string;
}

interface ManifestScreen {
  screenId: string;
  route: string;
  specs: {
    product: string;
    ui: string;
  };
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
}

function snakeCase(value: string): string {
  return value.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

describe('Traceability Matrix', () => {
  const repoRoot = resolve(__dirname, '..');
  const prototypeMap = readJson<{ prototypeFile: string; screens: PrototypeMapEntry[] }>(
    resolve(repoRoot, 'specs', 'bindings', 'html', 'prototype-map.json'),
  );
  const manifest = readJson<{ screens: ManifestScreen[] }>(resolve(repoRoot, 'specs', 'manifest.json'));
  const router = readFileSync(resolve(repoRoot, 'lib', 'generated', 'app', 'router.g.dart'), 'utf-8');

  test('HTML caption -> screenId -> specs -> generated file -> route', () => {
    for (const entry of prototypeMap.screens) {
      const manifestEntry = manifest.screens.find(screen => screen.screenId === entry.screenId);
      expect(manifestEntry).toBeDefined();
      expect(manifestEntry?.specs.ui).toBe(entry.ui);
      expect(manifestEntry?.specs.product).toBe(entry.product);

      const uiSpec = readJson<{ sourceEvidence?: { htmlCaption?: string } }>(resolve(repoRoot, entry.ui));
      expect(uiSpec.sourceEvidence?.htmlCaption).toBe(entry.caption);

      const generatedFile = resolve(repoRoot, 'lib', 'generated', 'screens', `${snakeCase(entry.screenId)}_screen.dart`);
      expect(existsSync(generatedFile)).toBe(true);

      expect(router).toContain(`import '../screens/${snakeCase(entry.screenId)}_screen.dart';`);
      expect(router).toContain(`name: '${entry.screenId}'`);
      expect(router).toContain(`path: '${manifestEntry?.route}'`);
    }
  });

  test('all prototype captions are represented in the manifest', () => {
    const manifestIds = new Set(manifest.screens.map(screen => screen.screenId));
    expect(prototypeMap.screens.every(entry => manifestIds.has(entry.screenId))).toBe(true);
  });
});
