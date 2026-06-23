import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

interface PrototypeScreenMapEntry {
  caption: string;
  screenId: string;
  kind: string;
  product: string;
  ui: string;
  extractionStrategy?: string;
  allowedComponents?: string[];
  evidenceAnchors?: string[];
}

interface PrototypeMap {
  prototypeFile: string;
  screens: PrototypeScreenMapEntry[];
}

type AnyObject = Record<string, any>;

type Confidence = 'high' | 'medium' | 'low';
type InferenceLevel = 'direct' | 'inferred';

interface HtmlNode {
  tag: string;
  attrs: Record<string, string>;
  children: HtmlNode[];
  text?: string;
}

interface RenderEvidence {
  visibleText: string[];
  selectorCounts: Record<string, number>;
  repeatedItemCounts: Array<{
    className: string;
    count: number;
    parentClassName?: string;
    sampleText?: string;
  }>;
  sectionGroups: Array<{
    title: string;
    trailingLabel?: string;
  }>;
}

interface Provenance {
  source: 'raw_html' | 'rendered_html';
  confidence: Confidence;
  inferenceLevel: InferenceLevel;
  caption: string;
  screenId: string;
  evidence?: Record<string, any>;
}

interface RefinementChange {
  screenId: string;
  fieldPath: string;
  field: string;
  before: any;
  after: any;
  provenance: Provenance;
}

interface RefinementWarning {
  screenId: string;
  fieldPath?: string;
  message: string;
  provenance: Provenance;
}

interface RefinementResult {
  changed: boolean;
  changes: RefinementChange[];
  warnings: RefinementWarning[];
}

interface RefinementContext {
  screenId: string;
  caption: string;
  renderEvidence: RenderEvidence;
}

interface ImportReport {
  prototypeFile: string;
  rawBlocksExtracted: number;
  screensUpdated: string[];
  filesWritten: string[];
  changes: RefinementChange[];
  warnings: RefinementWarning[];
  evidenceUsed: Array<{
    screenId: string;
    caption: string;
    selectorAnchors: string[];
    visibleTextSamples: string[];
  }>;
}

function readJson(filePath: string): AnyObject {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function writeJson(filePath: string, data: AnyObject): void {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function parseAttributes(attributeText: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attributeRegex = /([^\s=/>]+)(?:="([^"]*)")?/g;
  for (const match of attributeText.matchAll(attributeRegex)) {
    const key = match[1];
    if (!key || key === '/' || key.startsWith('!')) continue;
    attrs[key] = match[2] ?? '';
  }
  return attrs;
}

function parseHtmlFragment(html: string): HtmlNode {
  const root: HtmlNode = { tag: 'root', attrs: {}, children: [] };
  const stack: HtmlNode[] = [root];
  const tokenRegex = /<!--[\s\S]*?-->|<[^>]+>|[^<]+/g;
  const voidTags = new Set(['br', 'hr', 'img', 'input', 'meta', 'link']);

  for (const token of html.matchAll(tokenRegex)) {
    const value = token[0];
    if (!value || value.startsWith('<!--')) continue;

    if (value.startsWith('</')) {
      const closingTag = value.slice(2, -1).trim().toLowerCase();
      while (stack.length > 1 && stack[stack.length - 1].tag !== closingTag) {
        stack.pop();
      }
      if (stack.length > 1 && stack[stack.length - 1].tag === closingTag) {
        stack.pop();
      }
      continue;
    }

    if (value.startsWith('<')) {
      const isSelfClosing = value.endsWith('/>');
      const rawTag = value.slice(1, value.length - (isSelfClosing ? 2 : 1)).trim();
      const [tagNamePart, ...attributeParts] = rawTag.split(/\s+/);
      const tag = (tagNamePart || '').toLowerCase();
      if (!tag) continue;
      const attrs = parseAttributes(attributeParts.join(' '));
      const node: HtmlNode = { tag, attrs, children: [] };
      stack[stack.length - 1].children.push(node);
      if (!isSelfClosing && !voidTags.has(tag)) {
        stack.push(node);
      }
      continue;
    }

    const text = normalizeWhitespace(value);
    if (text) {
      stack[stack.length - 1].children.push({ tag: '#text', attrs: {}, children: [], text });
    }
  }

  return root;
}

function getElementChildren(node: HtmlNode): HtmlNode[] {
  return node.children.filter(child => child.tag !== '#text');
}

function getPrimaryClassName(node: HtmlNode): string | undefined {
  const classAttr = node.attrs.class || '';
  return normalizeWhitespace(classAttr)
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean)[0];
}

function getNodeText(node: HtmlNode): string {
  if (node.tag === '#text') return node.text || '';
  if (node.tag === 'br') return '\n';

  const blockTags = new Set(['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr', 'section', 'button']);
  const parts: string[] = [];
  if (blockTags.has(node.tag)) parts.push('\n');
  for (const child of node.children) {
    const childText = getNodeText(child);
    if (childText) parts.push(childText);
  }
  if (blockTags.has(node.tag)) parts.push('\n');
  return parts.join(' ');
}

function extractVisibleTextFromNode(node: HtmlNode, maxItems = 16): string[] {
  return getNodeText(node)
    .split(/\n+/)
    .map(part => normalizeWhitespace(part))
    .filter(Boolean)
    .slice(0, maxItems);
}

function countClassOccurrencesFromNode(node: HtmlNode, className: string): number {
  let count = 0;
  const visit = (current: HtmlNode) => {
    const classAttr = current.attrs.class || '';
    if (current.tag !== '#text' && classAttr.split(/\s+/).includes(className)) {
      count += 1;
    }
    for (const child of current.children) {
      visit(child);
    }
  };

  visit(node);
  return count;
}

function extractRepeatedItemCounts(node: HtmlNode): RenderEvidence['repeatedItemCounts'] {
  const repeated: RenderEvidence['repeatedItemCounts'] = [];
  const visit = (current: HtmlNode) => {
    const groups = new Map<string, HtmlNode[]>();
    for (const child of getElementChildren(current)) {
      const className = getPrimaryClassName(child) || child.tag;
      if (!className) continue;
      const list = groups.get(className) || [];
      list.push(child);
      groups.set(className, list);
    }

    for (const [className, children] of groups.entries()) {
      if (children.length <= 1) continue;
      repeated.push({
        className,
        count: children.length,
        parentClassName: getPrimaryClassName(current),
        sampleText: extractVisibleTextFromNode(children[0], 4).join(' ').trim(),
      });
    }

    for (const child of getElementChildren(current)) {
      visit(child);
    }
  };

  visit(node);

  const seen = new Map<string, RenderEvidence['repeatedItemCounts'][number]>();
  for (const entry of repeated) {
    const current = seen.get(entry.className);
    if (!current || entry.count > current.count) {
      seen.set(entry.className, entry);
    }
  }

  return Array.from(seen.values()).sort((left, right) => right.count - left.count || left.className.localeCompare(right.className));
}

function extractSectionGroupsFromNode(node: HtmlNode): RenderEvidence['sectionGroups'] {
  const groups: RenderEvidence['sectionGroups'] = [];
  const visit = (current: HtmlNode) => {
    const classAttr = current.attrs.class || '';
    if (!classAttr.split(/\s+/).includes('section-row')) {
      for (const child of getElementChildren(current)) {
        visit(child);
      }
      return;
    }

    const titleNode = getElementChildren(current).find(child => child.tag === 'h3');
    const linkNode = getElementChildren(current).find(child =>
      (child.attrs.class || '').split(/\s+/).includes('link'),
    );
    const title = titleNode ? extractVisibleTextFromNode(titleNode, 1).join(' ').trim() : '';
    const trailingLabel = linkNode ? extractVisibleTextFromNode(linkNode, 1).join(' ').trim() : '';
    if (title) {
      groups.push(trailingLabel ? { title, trailingLabel } : { title });
    }

    for (const child of getElementChildren(current)) {
      visit(child);
    }
  };

  visit(node);
  return groups;
}

function extractSelectorCountsFromNode(node: HtmlNode, anchors: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const anchor of anchors) {
    const className = anchor.replace(/^\./, '');
    counts[anchor] = countClassOccurrencesFromNode(node, className);
  }
  return counts;
}

function loadPrototypeMap(rootDir: string): PrototypeMap {
  const mapPath = resolve(rootDir, 'specs', 'bindings', 'html', 'prototype-map.json');
  return readJson(mapPath) as PrototypeMap;
}

function extractCaptionBlock(html: string, caption: string): string | null {
  const captionMarker = `<div class="caption">${caption}</div>`;
  const captionIndex = html.indexOf(captionMarker);
  if (captionIndex < 0) return null;

  const startIndex = html.lastIndexOf('<div class="phone-wrap">', captionIndex);
  if (startIndex < 0) return null;

  return html.slice(startIndex, captionIndex + captionMarker.length);
}

function extractVisibleText(htmlBlock: string, maxItems = 16): string[] {
  const blockText = htmlBlock
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|h1|h2|h3|h4|h5|h6|li|tr|section)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\r/g, '');

  const items = blockText
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  return items.slice(0, maxItems);
}

function countClassOccurrences(htmlBlock: string, className: string): number {
  const pattern = new RegExp(`class="[^"]*\\b${escapeRegex(className)}\\b[^"]*"`, 'g');
  return (htmlBlock.match(pattern) || []).length;
}

function extractClassCounts(htmlBlock: string): Array<{ className: string; count: number }> {
  const counts = new Map<string, number>();
  const classRegex = /class="([^"]+)"/g;
  for (const match of htmlBlock.matchAll(classRegex)) {
    const classes = (match[1] || '')
      .split(/\s+/)
      .map(entry => entry.trim())
      .filter(Boolean);
    for (const className of classes) {
      counts.set(className, (counts.get(className) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([className, count]) => ({ className, count }))
    .filter(entry => entry.count > 1)
    .sort((left, right) => right.count - left.count || left.className.localeCompare(right.className));
}

function extractSectionGroups(htmlBlock: string): Array<{ title: string; trailingLabel?: string }> {
  const groups: Array<{ title: string; trailingLabel?: string }> = [];
  const sectionRegex = /<div class="section-row">[\s\S]*?<h3>(.*?)<\/h3>(?:[\s\S]*?<span class="link">(.*?)<\/span>)?[\s\S]*?<\/div>/g;

  for (const match of htmlBlock.matchAll(sectionRegex)) {
    const title = (match[1] || '').replace(/\s+/g, ' ').trim();
    const trailingLabel = (match[2] || '').replace(/\s+/g, ' ').trim();
    if (!title) continue;
    groups.push(trailingLabel ? { title, trailingLabel } : { title });
  }

  return groups;
}

function inferTypeTokens(type: string): string[] {
  const normalized = type
    .replace(/^(component|field|action)\./, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase();

  return Array.from(
    new Set(
      normalized
        .split(/\s+/)
        .flatMap(token => [
          token,
          token.replace(/card$/, ''),
          token.replace(/list$/, ''),
        ])
        .filter(Boolean),
    ),
  );
}

function inferRepeatCount(nodeType: string, classCounts: Array<{ className: string; count: number }>): number | null {
  const tokens = inferTypeTokens(nodeType);
  const matches = classCounts.filter(entry => tokens.some(token => token && entry.className.includes(token)));
  if (matches.length === 0) return null;

  const strongest = matches[0];
  return strongest.count > 1 ? strongest.count : null;
}

function visitNodes(node: AnyObject, visitor: (current: AnyObject) => void): void {
  visitor(node);

  const regions = node?.layout?.regions;
  if (regions && typeof regions === 'object') {
    for (const value of Object.values(regions)) {
      if (value && typeof value === 'object') {
        visitNodes(value as AnyObject, visitor);
      }
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child && typeof child === 'object') {
        visitNodes(child as AnyObject, visitor);
      }
    }
  }
}

function findNodes(root: AnyObject, predicate: (current: AnyObject) => boolean): AnyObject[] {
  const matches: AnyObject[] = [];
  visitNodes(root, current => {
    if (predicate(current)) {
      matches.push(current);
    }
  });
  return matches;
}

function buildRenderEvidence(htmlBlock: string, anchors: string[] = []): RenderEvidence {
  const renderedBlock = htmlBlock.split('<div class="caption">')[0] || htmlBlock;
  const parsed = parseHtmlFragment(renderedBlock);

  return {
    visibleText: extractVisibleTextFromNode(parsed),
    selectorCounts: extractSelectorCountsFromNode(parsed, anchors),
    repeatedItemCounts: extractRepeatedItemCounts(parsed),
    sectionGroups: extractSectionGroupsFromNode(parsed),
  };
}

function setSourceEvidence(spec: AnyObject, caption: string, screenId: string, anchors: string[] = []): boolean {
  const nextEvidence = {
    htmlCaption: caption,
    screenId,
    anchors,
  };

  const current = spec.sourceEvidence || {};
  const currentJson = JSON.stringify(current);
  const nextJson = JSON.stringify(nextEvidence);
  if (currentJson === nextJson) return false;

  spec.sourceEvidence = nextEvidence;
  return true;
}

function setRenderEvidence(spec: AnyObject, htmlBlock: string, anchors: string[] = []): boolean {
  const nextEvidence = buildRenderEvidence(htmlBlock, anchors);
  const current = spec.renderEvidence || {};
  const currentJson = JSON.stringify(current);
  const nextJson = JSON.stringify(nextEvidence);
  if (currentJson === nextJson) return false;

  spec.renderEvidence = nextEvidence;
  return true;
}

function createProvenance(
  context: RefinementContext,
  source: Provenance['source'],
  confidence: Confidence,
  inferenceLevel: InferenceLevel,
  evidence: Record<string, any> = {},
): Provenance {
  return {
    source,
    confidence,
    inferenceLevel,
    caption: context.caption,
    screenId: context.screenId,
    evidence,
  };
}

function appendRefinementChange(
  uiSpec: AnyObject,
  report: RefinementResult,
  context: RefinementContext,
  source: Provenance['source'],
  fieldPath: string,
  field: string,
  before: any,
  after: any,
  confidence: Confidence,
  inferenceLevel: InferenceLevel,
  evidence: Record<string, any>,
): void {
  const provenance = createProvenance(context, source, confidence, inferenceLevel, evidence);
  const change: RefinementChange = {
    screenId: context.screenId,
    fieldPath,
    field,
    before,
    after,
    provenance,
  };
  report.changes.push(change);
  uiSpec.refinementLog = uiSpec.refinementLog || [];
  uiSpec.refinementLog.push(change);
  report.changed = true;
}

function appendRefinementWarning(
  report: RefinementResult,
  context: RefinementContext,
  source: Provenance['source'],
  fieldPath: string,
  message: string,
  confidence: Confidence,
  inferenceLevel: InferenceLevel,
  evidence: Record<string, any>,
): void {
  report.warnings.push({
    screenId: context.screenId,
    fieldPath,
    message,
    provenance: createProvenance(context, source, confidence, inferenceLevel, evidence),
  });
}

function matchRepeatedItemInference(
  repeatedItemCounts: RenderEvidence['repeatedItemCounts'],
  nodeType: string,
): { count?: number; confidence: Confidence; inferenceLevel: InferenceLevel; evidence?: Record<string, any>; warning?: string } {
  const tokens = inferTypeTokens(nodeType);
  const exactMatches = repeatedItemCounts.filter(entry => tokens.includes(entry.className));
  if (exactMatches.length === 1) {
    const match = exactMatches[0];
    return {
      count: match.count,
      confidence: 'high',
      inferenceLevel: 'direct',
      evidence: { className: match.className, count: match.count, parentClassName: match.parentClassName, sampleText: match.sampleText },
    };
  }

  if (exactMatches.length > 1) {
    return {
      confidence: 'low',
      inferenceLevel: 'inferred',
      warning: `Ambiguous repeat inference for ${nodeType}: ${exactMatches.map(entry => entry.className).join(', ')}`,
      evidence: { candidates: exactMatches },
    };
  }

  const fuzzyMatches = repeatedItemCounts.filter(entry =>
    tokens.some(token => token && (entry.className.includes(token) || token.includes(entry.className))),
  );

  if (fuzzyMatches.length === 1) {
    const match = fuzzyMatches[0];
    return {
      count: match.count,
      confidence: 'medium',
      inferenceLevel: 'inferred',
      evidence: { className: match.className, count: match.count, parentClassName: match.parentClassName, sampleText: match.sampleText },
    };
  }

  if (fuzzyMatches.length > 1) {
    return {
      confidence: 'low',
      inferenceLevel: 'inferred',
      warning: `Ambiguous repeat inference for ${nodeType}: ${fuzzyMatches.map(entry => entry.className).join(', ')}`,
      evidence: { candidates: fuzzyMatches },
    };
  }

  return {
    confidence: 'low',
    inferenceLevel: 'inferred',
    warning: `No repeat evidence matched ${nodeType}`,
    evidence: { tokens },
  };
}

function refineSpecFromRenderEvidence(uiSpec: AnyObject, context: RefinementContext): RefinementResult {
  const report: RefinementResult = {
    changed: false,
    changes: [],
    warnings: [],
  };

  const renderEvidence = context.renderEvidence;
  if (!renderEvidence) {
    appendRefinementWarning(report, context, 'rendered_html', 'renderEvidence', 'Missing render evidence', 'low', 'direct', {});
    return report;
  }

  const sectionGroupsByTitle = new Map<string, NonNullable<RenderEvidence['sectionGroups']>[number]>();
  for (const group of renderEvidence.sectionGroups || []) {
    if (group?.title) {
      sectionGroupsByTitle.set(group.title, group);
    }
  }

  visitNodes(uiSpec, node => {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'layout.horizontal' && node.props?.title) {
      const group = sectionGroupsByTitle.get(node.props.title);
      if (!group) {
        if (node.props.trailingLabel) {
          appendRefinementWarning(
            report,
            context,
            'rendered_html',
            `${node.type}.props.trailingLabel`,
            `No rendered section group matched title "${node.props.title}"`,
            'low',
            'inferred',
            { title: node.props.title },
          );
        }
        return;
      }

      if (group.trailingLabel) {
        if (node.props.trailingLabel !== group.trailingLabel) {
          const before = node.props.trailingLabel;
          node.props.trailingLabel = group.trailingLabel;
          appendRefinementChange(
            uiSpec,
            report,
            context,
            'rendered_html',
            `${node.type}.props.trailingLabel`,
            'trailingLabel',
            before,
            group.trailingLabel,
            'high',
            'direct',
            { title: group.title, trailingLabel: group.trailingLabel },
          );
        }
      } else if (node.props.trailingLabel) {
        appendRefinementWarning(
          report,
          context,
          'rendered_html',
          `${node.type}.props.trailingLabel`,
          `Rendered section "${group.title}" does not expose a trailing label`,
          'low',
          'direct',
          { title: group.title },
        );
      }

      if (!node.props.display && (group.trailingLabel || Array.isArray(node.children) && node.children.length > 0)) {
        const before = node.props.display;
        node.props.display = 'list';
        appendRefinementChange(
          uiSpec,
          report,
          context,
          'rendered_html',
          `${node.type}.props.display`,
          'display',
          before,
          'list',
          'medium',
          'inferred',
          { title: group.title, reason: group.trailingLabel ? 'trailingLabel' : 'children' },
        );
      }
    }

    const shouldInferRepeat = node.type?.startsWith('component.') && (node.repeat === true || typeof node.props?.repeatCount === 'number');
    if (shouldInferRepeat && node.props) {
      const inference = matchRepeatedItemInference(renderEvidence.repeatedItemCounts || [], node.type);
      if (inference.count && node.props.repeatCount !== inference.count) {
        const before = node.props.repeatCount;
        node.props.repeatCount = inference.count;
        appendRefinementChange(
          uiSpec,
          report,
          context,
          'rendered_html',
          `${node.type}.props.repeatCount`,
          'repeatCount',
          before,
          inference.count,
          inference.confidence,
          inference.inferenceLevel,
          inference.evidence || {},
        );
      } else if (!inference.count && inference.warning) {
        appendRefinementWarning(
          report,
          context,
          'rendered_html',
          `${node.type}.props.repeatCount`,
          inference.warning,
          inference.confidence,
          inference.inferenceLevel,
          inference.evidence || {},
        );
      }
    }
  });

  return report;
}

function importPrototypeHtml(rootDir: string, htmlPath: string): ImportReport {
  const prototypeHtml = readFileSync(htmlPath, 'utf-8');
  const prototypeMap = loadPrototypeMap(rootDir);
  const screensUpdated: string[] = [];
  const filesWritten: string[] = [];
  const changes: RefinementChange[] = [];
  const warnings: RefinementWarning[] = [];
  const evidenceUsed: ImportReport['evidenceUsed'] = [];
  let rawBlocksExtracted = 0;

  for (const screen of prototypeMap.screens) {
    const uiPath = resolve(rootDir, screen.ui);
    if (!existsSync(uiPath)) continue;

    const htmlBlock = extractCaptionBlock(prototypeHtml, screen.caption);
    if (!htmlBlock) continue;
    rawBlocksExtracted += 1;

    const uiSpec = readJson(uiPath);
    let changed = false;
    const context: RefinementContext = {
      screenId: screen.screenId,
      caption: screen.caption,
      renderEvidence: buildRenderEvidence(htmlBlock, screen.evidenceAnchors || []),
    };
    const evidenceReport: RefinementResult = {
      changed: false,
      changes: [],
      warnings: [],
    };

    const nextSourceEvidence = {
      htmlCaption: screen.caption,
      screenId: screen.screenId,
      anchors: screen.evidenceAnchors || [],
    };
    const sourceBefore = uiSpec.sourceEvidence;
    if (JSON.stringify(sourceBefore || {}) !== JSON.stringify(nextSourceEvidence)) {
      uiSpec.sourceEvidence = nextSourceEvidence;
      changed = true;
      appendRefinementChange(
        uiSpec,
        evidenceReport,
        context,
        'raw_html',
        'sourceEvidence',
        'sourceEvidence',
        sourceBefore,
        nextSourceEvidence,
        'high',
        'direct',
        { caption: screen.caption, anchors: screen.evidenceAnchors || [] },
      );
    }

    const nextRenderEvidence = context.renderEvidence;
    const renderBefore = uiSpec.renderEvidence;
    if (JSON.stringify(renderBefore || {}) !== JSON.stringify(nextRenderEvidence)) {
      uiSpec.renderEvidence = nextRenderEvidence;
      changed = true;
      appendRefinementChange(
        uiSpec,
        evidenceReport,
        context,
        'rendered_html',
        'renderEvidence',
        'renderEvidence',
        renderBefore,
        nextRenderEvidence,
        'high',
        'direct',
        { caption: screen.caption, anchors: screen.evidenceAnchors || [] },
      );
    }

    changes.push(...evidenceReport.changes);

    const refinement = refineSpecFromRenderEvidence(uiSpec, context);
    changed = refinement.changed || changed;
    changes.push(...refinement.changes);
    warnings.push(...refinement.warnings);
    evidenceUsed.push({
      screenId: screen.screenId,
      caption: screen.caption,
      selectorAnchors: screen.evidenceAnchors || [],
      visibleTextSamples: (uiSpec.renderEvidence?.visibleText || []).slice(0, 6),
    });

    if (changed) {
      writeJson(uiPath, uiSpec);
      screensUpdated.push(screen.screenId);
      filesWritten.push(uiPath);
    }
  }

  return {
    prototypeFile: htmlPath,
    rawBlocksExtracted,
    screensUpdated,
    filesWritten,
    changes,
    warnings,
    evidenceUsed,
  };
}

function main() {
  const rootDir = process.cwd();
  const htmlArg = process.argv[2] || 'fahs_flutter_like_prototype_v2.html';
  const htmlPath = resolve(rootDir, htmlArg);

  if (!existsSync(htmlPath)) {
    console.error(`Prototype HTML not found: ${htmlPath}`);
    process.exit(1);
  }

  const result = importPrototypeHtml(rootDir, htmlPath);
  console.log(`Imported prototype HTML from ${htmlArg}`);
  console.log(`Raw blocks extracted: ${result.rawBlocksExtracted}`);
  console.log(`Screens updated: ${result.screensUpdated.length > 0 ? result.screensUpdated.join(', ') : 'none'}`);
  console.log('Fields changed:');
  if (result.changes.length === 0) {
    console.log('  none');
  } else {
    for (const change of result.changes) {
      console.log(`  - ${change.screenId}: ${change.fieldPath}`);
    }
  }
  console.log('Warnings:');
  if (result.warnings.length === 0) {
    console.log('  none');
  } else {
    for (const warning of result.warnings) {
      console.log(`  - ${warning.screenId}: ${warning.message}`);
    }
  }
  console.log('Evidence used:');
  if (result.evidenceUsed.length === 0) {
    console.log('  none');
  } else {
    for (const evidence of result.evidenceUsed) {
      const sample = evidence.visibleTextSamples.slice(0, 3).join(' | ');
      console.log(`  - ${evidence.screenId}: ${evidence.selectorAnchors.join(', ')}${sample ? ` :: ${sample}` : ''}`);
    }
  }
  console.log('Files written:');
  if (result.filesWritten.length === 0) {
    console.log('  none');
  } else {
    for (const file of result.filesWritten) {
      console.log(`  - ${file}`);
    }
  }
}

if (require.main === module) {
  main();
}

export {
  extractCaptionBlock,
  buildRenderEvidence,
  importPrototypeHtml,
  refineSpecFromRenderEvidence,
};
