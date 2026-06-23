import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

interface PrototypeMap {
  prototypeFile: string;
  screens: Array<{
    caption: string;
    screenId: string;
  }>;
}

function extractHead(html: string): string {
  const match = html.match(/<head>([\s\S]*?)<\/head>/i);
  if (!match) throw new Error('Prototype HTML is missing a <head> element');
  return match[1];
}

function extractCaptionBlock(html: string, caption: string): string {
  const marker = `<div class="caption">${caption}</div>`;
  const captionIndex = html.indexOf(marker);
  if (captionIndex < 0) throw new Error(`Caption not found: ${caption}`);

  const startIndex = html.lastIndexOf('<div class="phone-wrap">', captionIndex);
  if (startIndex < 0) throw new Error(`Phone block not found for caption: ${caption}`);

  const block = html.slice(startIndex, captionIndex + marker.length);
  const phoneMatch = block.match(/<div class="phone">[\s\S]*<\/div><div class="caption">/);
  if (!phoneMatch) throw new Error(`Phone element could not be isolated for caption: ${caption}`);

  return phoneMatch[0].replace(/<div class="caption">$/, '');
}

export function extractPrototypeScreenHtml(rootDir: string): string[] {
  const mapPath = resolve(rootDir, 'specs/bindings/html/prototype-map.json');
  const map = JSON.parse(readFileSync(mapPath, 'utf8')) as PrototypeMap;
  const prototypePath = resolve(rootDir, map.prototypeFile);
  const prototype = readFileSync(prototypePath, 'utf8');
  const head = extractHead(prototype);
  const outputRoot = resolve(rootDir, 'artifacts/prototype-golden-comparison');
  const written: string[] = [];

  for (const screen of map.screens) {
    const phone = extractCaptionBlock(prototype, screen.caption);
    const outputPath = resolve(outputRoot, screen.screenId, 'prototype.html');
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(
      outputPath,
      `<!doctype html>
<html lang="ar" dir="rtl">
<head>
${head}
<style>
html, body { width: 390px; height: 844px; margin: 0; padding: 0; overflow: hidden; }
body { background: #fff; }
.phone { box-shadow: none; }
</style>
</head>
<body>${phone}</body>
</html>
`,
      'utf8',
    );
    written.push(outputPath);
  }

  return written;
}

if (require.main === module) {
  const rootDir = resolve(__dirname, '..');
  const written = extractPrototypeScreenHtml(rootDir);
  console.log(`Wrote ${written.length} mapped prototype screen documents:`);
  for (const file of written) console.log(`  - ${file}`);
}
