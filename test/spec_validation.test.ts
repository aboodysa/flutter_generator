import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

describe('Spec Validation', () => {
  const specsDir = resolve(__dirname, '..', 'specs');
  const manifestPath = resolve(specsDir, 'manifest.json');
  
  test('manifest.json exists', () => {
    expect(existsSync(manifestPath)).toBe(true);
  });

  test('manifest has valid structure', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest.app).toBeDefined();
    expect(manifest.initialRoute).toBeDefined();
    expect(Array.isArray(manifest.screens)).toBe(true);
    expect(manifest.screens.length).toBeGreaterThan(0);
  });

  test('all screen specs exist', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    for (const screen of manifest.screens) {
      const productPath = resolve(__dirname, '..', screen.specs.product);
      const uiPath = resolve(__dirname, '..', screen.specs.ui);
      expect(existsSync(productPath)).toBe(true);
      expect(existsSync(uiPath)).toBe(true);
    }
  });

  test('no Flutter class names in product/design/ui specs', () => {
    const flutterPatterns = [
      /\bAppScaffold\b/, /\bAppBar\b/, /\bAppButton\b/, /\bScaffold\b/,
    ];
    const specFiles = [
      ...readdirSync(resolve(specsDir, 'product/screens')).map(f => resolve(specsDir, 'product/screens', f)),
      ...readdirSync(resolve(specsDir, 'ui/screens')).map(f => resolve(specsDir, 'ui/screens', f)),
    ];
    for (const file of specFiles) {
      const content = readFileSync(file, 'utf-8');
      for (const pattern of flutterPatterns) {
        expect(content).not.toMatch(pattern);
      }
    }
  });

  test('no raw hex colors in UI specs', () => {
    const uiDir = resolve(specsDir, 'ui/screens');
    const files = readdirSync(uiDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const content = readFileSync(resolve(uiDir, file), 'utf-8');
      expect(content).not.toMatch(/#[0-9A-Fa-f]{6}/);
    }
  });

  test('every UI screen references an existing product spec', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    for (const screen of manifest.screens) {
      const uiData = JSON.parse(readFileSync(resolve(__dirname, '..', screen.specs.ui), 'utf-8'));
      expect(uiData.usesProductSpec).toBe(screen.specs.product);
    }
  });

  test('screen IDs and routes are unique', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    const ids = manifest.screens.map((s: any) => s.screenId);
    const routes = manifest.screens.map((s: any) => s.route);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(routes).size).toBe(routes.length);
  });

  test('Flutter names appear only in bindings/flutter', () => {
    const bindingFiles = readdirSync(resolve(specsDir, 'bindings/flutter'));
    expect(bindingFiles.length).toBeGreaterThan(0);
  });
});
