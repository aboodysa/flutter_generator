import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

describe('Generator Tests', () => {
  const generatedDir = resolve(__dirname, '..', 'lib', 'generated', 'screens');

  test('HomeScreen generation succeeds', () => {
    const path = resolve(generatedDir, 'home_screen.dart');
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('HomeScreen');
    expect(content).toContain('GENERATED CODE');
  });

  test('PhoneInputScreen generation succeeds', () => {
    const path = resolve(generatedDir, 'phone_input_screen.dart');
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('PhoneInputScreen');
  });

  test('PaymentScreen generation succeeds', () => {
    const path = resolve(generatedDir, 'payment_screen.dart');
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('PaymentScreen');
  });

  test('generated files include generated header', () => {
    const path = resolve(generatedDir, 'home_screen.dart');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('GENERATED CODE - DO NOT MODIFY BY HAND');
    expect(content).toContain('Generator: tools/generate_flutter.ts');
  });

  test('generated screens use AppScaffold, not raw Scaffold', () => {
    const path = resolve(generatedDir, 'home_screen.dart');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('AppScaffold');
  });

  test('generated screens use AppBanner, not raw banners', () => {
    const path = resolve(generatedDir, 'home_screen.dart');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('AppBanner');
  });

  test('generated screens use AppCard for cards', () => {
    const path = resolve(generatedDir, 'home_screen.dart');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('AppCard');
  });

  test('all manifest screens are generated', () => {
    const { readdirSync } = require('fs');
    const manifest = JSON.parse(
      readFileSync(resolve(__dirname, '..', 'specs', 'manifest.json'), 'utf-8'),
    );
    const files = readdirSync(generatedDir);
    expect(files).toContain('home_screen.dart');
    expect(files).toContain('phone_input_screen.dart');
    expect(files).toContain('payment_screen.dart');
    expect(files).toContain('splash_screen.dart');
    expect(files.length).toBe(manifest.screens.length);
    for (const screen of manifest.screens) {
      expect(files).toContain(`${screen.screenId}_screen.dart`);
    }
  });

  test('generated screens use design system bottom nav', () => {
    const path = resolve(generatedDir, 'home_screen.dart');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('AppBottomNav');
  });

  test('generated screens use AppActionDispatcher navigation', () => {
    const path = resolve(generatedDir, 'home_screen.dart');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('AppActionDispatcher.dispatch');
    expect(content).not.toContain('context.goNamed');
  });
});
