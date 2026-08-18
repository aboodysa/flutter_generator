#!/usr/bin/env node
// md2html.js — dependency-free GitHub-flavored-Markdown subset -> standalone HTML, for feeding
// into pdf_build.sh (Chrome --headless --print-to-pdf) so .md docs get a PDF twin.
// Supports: ATX headings, fenced code, GFM tables, unordered/ordered lists, blockquotes, hr,
// inline code/bold/italic/links, paragraphs. Output is self-contained (inline CSS) and prints
// cleanly (A4-ish, system serif/sans).
//
// Usage:
//   npx ts-node --transpile-only tools/md2html.js <in.md> <out.html>   (or:)
//   node tools/md2html.js <in.md> <out.html>

const fs = require('fs');

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s) {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

function renderTable(rows) {
  const head = rows.shift().map(inline);
  const html = ['<table><thead><tr>' + head.map((c) => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>'];
  for (const r of rows) {
    html.push('<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>');
  }
  html.push('</tbody></table>');
  return html.join('\n');
}

function render(lines) {
  const out = [];
  let i = 0;
  const fences = [];
  const pushFence = (t) => { if (fences.length && fences[0] === t) fences.pop(); else fences.push(t); };
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      out.push('<pre><code>' + fences.join('') + '</code></pre>');
      fences.length = 0;
      i++;
      let code = [];
      while (i < lines.length && !/^```/.test(lines[i])) { code.push(esc(lines[i])); i++; }
      if (i < lines.length) i++;
      out.push('<pre><code>' + code.join('\n') + '</code></pre>');
      continue;
    }
    if (/^#{1,6}\s/.test(line)) {
      const m = line.match(/^(#{1,6})\s+(.*)$/);
      const lvl = m[1].length;
      out.push(`<h${lvl}>` + inline(m[2].replace(/\s+#+\s*$/, '')) + `</h${lvl}>`);
      i++;
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        if (!/^:?-+:?$/.test(cells.join(''))) rows.push(cells);
        i++;
      }
      out.push(renderTable(rows));
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      out.push('<ul>');
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        out.push('<li>' + inline(lines[i].replace(/^\s*[-*]\s+/, '')) + '</li>');
        i++;
      }
      out.push('</ul>');
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      out.push('<ol>');
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        out.push('<li>' + inline(lines[i].replace(/^\s*\d+\.\s+/, '')) + '</li>');
        i++;
      }
      out.push('</ol>');
      continue;
    }
    if (/^>\s?/.test(line)) {
      out.push('<blockquote>');
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        out.push('<p>' + inline(lines[i].replace(/^>\s?/, '')) + '</p>');
        i++;
      }
      out.push('</blockquote>');
      continue;
    }
    if (/^\s*---+$/.test(line)) {
      out.push('<hr/>');
      i++;
      continue;
    }
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }
    const para = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) &&
           !/^#{1,6}\s/.test(lines[i]) && !/^```/.test(lines[i]) &&
           !/^\s*\|.*\|\s*$/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) &&
           !/^\s*\d+\.\s+/.test(lines[i]) && !/^>\s?/.test(lines[i])) {
      para.push(inline(lines[i]));
      i++;
    }
    out.push('<p>' + para.join(' ') + '</p>');
  }
  return out.join('\n');
}

const [inFile, outFile] = process.argv.slice(2);
if (!inFile || !outFile) {
  console.error('usage: node md2html.js <in.md> <out.html>');
  process.exit(1);
}
const md = fs.readFileSync(inFile, 'utf8');
const body = render(md.split(/\r?\n/));
const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<title>${esc(inFile.replace(/\.md$/, ''))}</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 46em;
         margin: 2em auto 4em; padding: 0 1.4em; line-height: 1.5; color: #1a1a1a; }
  h1 { font-size: 1.6em; border-bottom: 2px solid #eee; padding-bottom: .3em; }
  h2 { font-size: 1.25em; margin-top: 1.6em; border-bottom: 1px solid #eee; padding-bottom: .2em; }
  h3 { font-size: 1.05em; margin-top: 1.2em; }
  code { font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: .88em; background: #f5f5f5;
         padding: .1em .3em; border-radius: 3px; }
  pre { background: #f5f5f5; padding: .8em 1em; border-radius: 6px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: .92em; }
  th, td { border: 1px solid #ddd; padding: .45em .6em; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; }
  blockquote { margin: .8em 0; padding: .1em 1em; border-left: 4px solid #ccc; color: #444; }
  hr { border: none; border-top: 2px solid #eee; margin: 1.6em 0; }
  a { color: #0645ad; }
  @media print { body { margin: 0 1em; } }
</style></head><body>
${body}
</body></html>
`;
fs.writeFileSync(outFile, html);
console.log(`[md2html] ${inFile} -> ${outFile}`);