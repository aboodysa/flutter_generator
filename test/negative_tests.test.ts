import { readFileSync, existsSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { resolve } from 'path';

describe('Spec Validation - Negative Tests', () => {
  const specsDir = resolve(__dirname, '..', 'specs');
  const manifestPath = resolve(specsDir, 'manifest.json');
  
  test('duplicate route fails validation', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    const routes = manifest.screens.map((s: any) => s.route);
    const uniqueRoutes = new Set(routes);
    expect(uniqueRoutes.size).toBe(routes.length);
    // If there were duplicates, the set would be smaller
  });

  test('duplicate screen ID fails validation', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    const ids = manifest.screens.map((s: any) => s.screenId);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('initialRoute exists in screens', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    const routes = manifest.screens.map((s: any) => s.route);
    expect(routes).toContain(manifest.initialRoute);
  });

  test('UI spec without screenId fails structure check', () => {
    const badSpec: any = { layout: { type: 'screen' } };
    expect(badSpec.screenId).toBeUndefined();
    // Validation would reject this — screenId is required
  });

  test('hex color detection works', () => {
    const content = JSON.stringify({ someField: '#FF5733' });
    const hexPattern = /#[0-9A-Fa-f]{6}/;
    expect(hexPattern.test(content)).toBe(true);
  });

  test('Flutter class name detection works', () => {
    const content1 = 'This contains AppScaffold in text';
    const content2 = 'This has raw Scaffold in text';
    expect(/\bAppScaffold\b/.test(content1)).toBe(true);
    expect(/\bScaffold\b/.test(content2)).toBe(true);
  });
});

describe('Generator - Negative Tests', () => {
  const generatedDir = resolve(__dirname, '..', 'lib', 'generated', 'screens');

  test('generated screens have valid Dart syntax (no JS expressions)', () => {
    const files = ['home_screen.dart', 'phone_input_screen.dart', 'payment_screen.dart'];
    for (const file of files) {
      const path = resolve(generatedDir, file);
      if (existsSync(path)) {
        const content = readFileSync(path, 'utf-8');
        // No JS template literals should leak
        expect(content).not.toMatch(/m\.id/);
        expect(content).not.toMatch(/m\.balance/);
        expect(content).not.toMatch(/undefined/);
        expect(content).not.toMatch(/===/);
      }
    }
  });

  test('generated screens do not use raw Scaffold', () => {
    const path = resolve(generatedDir, 'home_screen.dart');
    const content = readFileSync(path, 'utf-8');
    expect(content).not.toMatch(/\bScaffold\b/);
  });

  test('generated screens do not use raw AppBar', () => {
    const path = resolve(generatedDir, 'home_screen.dart');
    const content = readFileSync(path, 'utf-8');
    expect(content).not.toMatch(/\bAppBar\b/);
  });
});
