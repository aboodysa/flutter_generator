import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { spawnSync } from 'child_process';

import { extractPrototypeScreenHtml } from '../tools/extract_prototype_screen_html';

describe('mapped prototype screen capture documents', () => {
  test('extracts every mapped caption into a deterministic viewport', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'prototype-capture-'));
    mkdirSync(resolve(root, 'specs/bindings/html'), { recursive: true });
    writeFileSync(
      resolve(root, 'specs/bindings/html/prototype-map.json'),
      JSON.stringify({
        prototypeFile: 'prototype.html',
        screens: [
          { screenId: 'first', caption: 'First' },
          { screenId: 'second', caption: 'Second' },
        ],
      }),
    );
    writeFileSync(
      resolve(root, 'prototype.html'),
      '<html><head><style>.phone{width:390px;height:844px}</style></head><body>' +
        '<div class="phone-wrap"><div class="phone"><div>one</div></div><div class="caption">First</div></div>' +
        '<div class="phone-wrap"><div class="phone"><div>two</div></div><div class="caption">Second</div></div>' +
        '</body></html>',
    );

    const written = extractPrototypeScreenHtml(root);

    expect(written).toHaveLength(2);
    for (const path of written) {
      expect(existsSync(path)).toBe(true);
      const html = readFileSync(path, 'utf8');
      expect(html).toContain('width: 390px; height: 844px');
      expect(html).toContain('overflow: hidden');
      expect(html).not.toContain('class="caption"');
    }
    expect(readFileSync(written[0], 'utf8')).toContain('<div>one</div>');
    expect(readFileSync(written[0], 'utf8')).not.toContain('<div>two</div>');
  });
});

describe('prototype versus golden comparison policy', () => {
  test('all-screen pixel comparison is disabled by default and does not require screenshots', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'prototype-compare-'));
    mkdirSync(resolve(root, 'specs/bindings/html'), { recursive: true });
    writeFileSync(
      resolve(root, 'specs/bindings/html/prototype-map.json'),
      JSON.stringify({
        prototypeFile: 'prototype.html',
        screens: [{ screenId: 'payment', caption: 'Payment' }],
      }),
    );

    const script = resolve(__dirname, '../tools/compare_all_goldens.py');
    const result = spawnSync('python3', [script, '--root', root], {
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Pixel comparison is disabled');

    const reportPath = resolve(root, 'artifacts/prototype-golden-comparison/comparison-report.json');
    expect(existsSync(reportPath)).toBe(true);
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    expect(report.status).toBe('disabled');
    expect(report.screens).toContainEqual(
      expect.objectContaining({
        screenId: 'payment',
        status: 'not_compared',
      }),
    );
  });
});
