/**
 * ExportCoreGenerator — structural, deterministic, 0% LLM (L3).
 * Emits `core/export.dart` once per app with >=1 resolved export screen (operations.ts's
 * hasExport). Mirrors core/split.dart/core/budget.dart's precedent: a single shared,
 * row-shape-agnostic module — `toCsv`/`toJson` operate on plain `List<Map<String, dynamic>>` rows
 * the caller (screen.ts's export button) already field-formatted (Money via `.format()`, enum via
 * `.name`, DateTime via ISO 8601 — the same per-type rendering `fieldValue()` already uses for
 * on-screen text), so this file never needs to know which entity or fields it's exporting.
 * No `csv`/`intl` package dependency — kept dependency-free like money.dart/split.dart.
 */
export function generateExportCore(): string {
  return `// [generated] generator=ExportCoreGenerator template=export_core.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'dart:convert';

// L3: CSV per RFC 4180 — a cell is quoted iff it contains a comma, a quote, or a newline; an
// embedded quote is escaped by doubling it. \`headers\` is the caller-declared column order (never
// inferred from row keys), so column order is stable and secret-typed fields the caller already
// omitted from every row's keys never reappear via a stray key.
String toCsv(List<Map<String, dynamic>> rows, List<String> headers) {
  final buffer = StringBuffer();
  buffer.writeln(headers.map(_csvCell).join(','));
  for (final row in rows) {
    buffer.writeln(headers.map((h) => _csvCell(row[h])).join(','));
  }
  return buffer.toString();
}

String _csvCell(Object? value) {
  final s = value?.toString() ?? '';
  if (s.contains(',') || s.contains('"') || s.contains('\\n')) {
    return '"\${s.replaceAll('"', '""')}"';
  }
  return s;
}

// JSON export is the same rows the CSV path renders (flat, pre-formatted maps) — one row shape
// for both formats, not a richer nested JSON-only shape, so "csv+json" never disagrees with itself
// on what a field's exported value is.
String toJson(List<Map<String, dynamic>> rows) => jsonEncode(rows);
`;
}
