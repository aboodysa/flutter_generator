import { compileExpression, normalizeExpression } from '../builder/src/expression';
import { evaluateExpression } from '../builder/src/expression_eval';
import { Field, RuleExpression } from '../builder/src/types';

// BREL Task 3 (BREL_TYPES_IMPL_BRIEF_CLAUDE.md) — evaluator parity + golden compilation tests.
// Each case asserts BOTH the committed Dart string from compileExpression AND the committed
// boolean result from evaluateExpression against a known field-value record, proving the Dart
// compiler and the reference evaluator agree on the same RuleExpression. `now` is pinned so
// daysSince/daysUntil/daysSince>/daysSince< stay deterministic.

const fields: Field[] = [
  { name: 'id', type: 'String', required: true },
  { name: 'amount', type: 'double', semanticType: 'Money', currency: 'SAR' },
  { name: 'startDate', type: 'DateTime' },
  { name: 'endDate', type: 'DateTime' },
  { name: 'status', type: 'enum', of: 'OrderStatus' },
  { name: 'active', type: 'bool' },
  { name: 'title', type: 'String' },
  { name: 'tags', type: 'List', of: 'String' },
  { name: 'score', type: 'int' },
];

const NOW = new Date('2026-08-20T00:00:00.000Z');

interface GoldenCase {
  name: string;
  node: RuleExpression;
  record: Record<string, unknown>;
  dart: string;
  result: boolean;
}

const goldens: GoldenCase[] = [
  {
    name: 'numeric >= (int field)',
    node: normalizeExpression({ field: 'score', operator: '>=', value: 5 }),
    record: { score: 7 },
    dart: 'e.score >= 5',
    result: true,
  },
  {
    name: 'Money field >= numeric literal (minorUnits)',
    node: normalizeExpression({ field: 'amount', operator: '>=', value: 100 }),
    record: { amount: 15000 }, // $150.00, matches literalExpr's Math.round(100 * 100) comparand shape
    dart: 'e.amount.minorUnits >= 10000',
    result: true,
  },
  {
    name: 'Money field < numeric literal, false case',
    node: normalizeExpression({ field: 'amount', operator: '<', value: 100 }),
    record: { amount: 15000 },
    dart: 'e.amount.minorUnits < 10000',
    result: false,
  },
  {
    name: 'String == literal',
    node: normalizeExpression({ field: 'title', operator: '==', value: 'Invoice' }),
    record: { title: 'Invoice' },
    dart: "e.title == 'Invoice'",
    result: true,
  },
  {
    name: 'String contains',
    node: normalizeExpression({ field: 'title', operator: 'contains', value: 'voi' }),
    record: { title: 'Invoice' },
    dart: "e.title.contains('voi')",
    result: true,
  },
  {
    name: 'String startsWith / false case',
    node: normalizeExpression({ field: 'title', operator: 'startsWith', value: 'zzz' }),
    record: { title: 'Invoice' },
    dart: "e.title.startsWith('zzz')",
    result: false,
  },
  {
    name: 'String endsWith',
    node: normalizeExpression({ field: 'title', operator: 'endsWith', value: 'oice' }),
    record: { title: 'Invoice' },
    dart: "e.title.endsWith('oice')",
    result: true,
  },
  {
    name: 'String matches (regex)',
    node: normalizeExpression({ field: 'title', operator: 'matches', value: '^Inv.*e$' }),
    record: { title: 'Invoice' },
    dart: "RegExp('^Inv.*e\$').hasMatch(e.title)",
    result: true,
  },
  {
    name: 'enum field ==',
    node: normalizeExpression({ field: 'status', operator: '==', value: 'approved' }),
    record: { status: 'approved' },
    dart: 'e.status == OrderStatus.approved',
    result: true,
  },
  {
    // compileExpression's literalExpr compiles array elements with no counterpart (expression.ts,
    // frozen this slice) — an enum field's `in [...]` list literal stays plain strings, not
    // `OrderStatus.x`. The evaluator mirrors that exact (pre-existing, unmodified) behavior: the
    // record's enum value is compared against the string list as `evalLiteral` also leaves it.
    name: 'enum field in [...] (array literal compiles without enum qualification — frozen expression.ts behavior)',
    node: normalizeExpression({ field: 'status', operator: 'in', value: ['draft', 'submitted'] }),
    record: { status: 'submitted' },
    dart: "['draft', 'submitted'].contains(e.status)",
    result: true,
  },
  {
    name: 'enum field notIn [...] / false case (member present)',
    node: normalizeExpression({ field: 'status', operator: 'notIn', value: ['draft', 'submitted'] }),
    record: { status: 'submitted' },
    dart: "!['draft', 'submitted'].contains(e.status)",
    result: false,
  },
  {
    name: 'bool field !=',
    node: normalizeExpression({ field: 'active', operator: '!=', value: false }),
    record: { active: true },
    dart: 'e.active != false',
    result: true,
  },
  {
    name: 'isNull on a present field',
    node: normalizeExpression({ field: 'id', operator: 'isNull', value: null }),
    record: { id: 'abc' },
    dart: 'e.id == null',
    result: false,
  },
  {
    name: 'isNotNull on a present field',
    node: normalizeExpression({ field: 'id', operator: 'isNotNull', value: null }),
    record: { id: 'abc' },
    dart: 'e.id != null',
    result: true,
  },
  {
    name: 'isEmpty on a List field',
    node: normalizeExpression({ field: 'tags', operator: 'isEmpty', value: null }),
    record: { tags: [] },
    dart: 'e.tags.isEmpty',
    result: true,
  },
  {
    name: 'isNotEmpty on a List field, false case',
    node: normalizeExpression({ field: 'tags', operator: 'isNotEmpty', value: null }),
    record: { tags: [] },
    dart: 'e.tags.isNotEmpty',
    result: false,
  },
  {
    name: 'daysSince(fn) > literal — value-kind fn inside a Comparison',
    node: normalizeExpression({ fn: 'daysSince', args: [{ field: 'startDate' }], op: '>', value: 5 }),
    record: { startDate: new Date('2026-08-01T00:00:00.000Z') }, // 19 days before NOW
    dart: 'DateTime.now().difference(e.startDate).inDays > 5',
    result: true,
  },
  {
    name: 'daysUntil(fn) < literal, false case',
    node: normalizeExpression({ fn: 'daysUntil', args: [{ field: 'endDate' }], op: '<', value: 5 }),
    record: { endDate: new Date('2026-09-30T00:00:00.000Z') }, // 41 days after NOW
    dart: 'e.endDate.difference(DateTime.now()).inDays < 5',
    result: false,
  },
  {
    name: 'isBefore(fn) — bare predicate leaf',
    node: { fn: 'isBefore', args: [{ field: 'startDate' }, { field: 'endDate' }] },
    record: { startDate: new Date('2026-08-01'), endDate: new Date('2026-09-01') },
    dart: 'e.startDate.isBefore(e.endDate)',
    result: true,
  },
  {
    name: 'isAfter(fn) — bare predicate leaf, false case',
    node: { fn: 'isAfter', args: [{ field: 'startDate' }, { field: 'endDate' }] },
    record: { startDate: new Date('2026-08-01'), endDate: new Date('2026-09-01') },
    dart: 'e.startDate.isAfter(e.endDate)',
    result: false,
  },
  {
    name: 'isBetween(fn) — bare predicate leaf',
    node: { fn: 'isBetween', args: [{ field: 'startDate' }, { field: 'startDate' }, { field: 'endDate' }] },
    record: { startDate: new Date('2026-08-15'), endDate: new Date('2026-09-01') },
    dart: '(e.startDate.isAfter(e.startDate) && e.startDate.isBefore(e.endDate))',
    result: false, // a Date is never strictly after itself
  },
  {
    name: 'and of two comparisons, both true',
    node: normalizeExpression({
      and: [
        { field: 'active', operator: '==', value: true },
        { field: 'score', operator: '>', value: 0 },
      ],
    }),
    record: { active: true, score: 3 },
    dart: '(e.active == true &&\n        e.score > 0)',
    result: true,
  },
  {
    name: 'or of two comparisons, one true (short-circuit path)',
    node: normalizeExpression({
      or: [
        { field: 'status', operator: '==', value: 'draft' },
        { field: 'status', operator: '==', value: 'submitted' },
      ],
    }),
    record: { status: 'submitted' },
    dart: '(e.status == OrderStatus.draft ||\n        e.status == OrderStatus.submitted)',
    result: true,
  },
  {
    name: 'not of a comparison',
    node: normalizeExpression({ not: { field: 'status', operator: '==', value: 'rejected' } }),
    record: { status: 'approved' },
    dart: '!(e.status == OrderStatus.rejected)',
    result: true,
  },
  {
    name: 'choice_demo AnswerAcceptable shape — or of two enum == comparisons',
    node: normalizeExpression({
      or: [
        { field: 'status', operator: '==', value: 'draft' },
        { field: 'status', operator: '==', value: 'approved' },
      ],
    }),
    record: { status: 'rejected' },
    dart: '(e.status == OrderStatus.draft ||\n        e.status == OrderStatus.approved)',
    result: false,
  },
  {
    name: 'nested: and(not(or(...)), comparison) — mixed depth',
    node: normalizeExpression({
      and: [
        { not: { or: [{ field: 'status', operator: '==', value: 'rejected' }, { field: 'status', operator: '==', value: 'draft' }] } },
        { field: 'amount', operator: '>=', value: 50 },
      ],
    }),
    record: { status: 'approved', amount: 6000 },
    dart: '(!((e.status == OrderStatus.rejected ||\n        e.status == OrderStatus.draft)) &&\n        e.amount.minorUnits >= 5000)',
    result: true,
  },
];

describe('golden compilation + evaluator parity', () => {
  test.each(goldens.map((g): [string, GoldenCase] => [g.name, g]))('%s', (_name, g) => {
    expect(compileExpression(g.node, fields)).toBe(g.dart);
    expect(evaluateExpression(g.node, g.record, fields, NOW)).toBe(g.result);
  });
});

describe('evaluateExpression — short-circuit semantics match JS && / ||', () => {
  test('and stops at the first false (mirrors Dart && short-circuit)', () => {
    const node = normalizeExpression({
      and: [
        { field: 'active', operator: '==', value: false }, // false — should short-circuit
        { fn: 'isBefore', args: [{ field: 'startDate' }, { field: 'endDate' }] },
      ],
    });
    // If short-circuit didn't happen, evaluating isBefore with undefined dates would throw.
    expect(evaluateExpression(node, { active: true }, fields, NOW)).toBe(false);
  });

  test('or stops at the first true (mirrors Dart || short-circuit)', () => {
    const node = normalizeExpression({
      or: [
        { field: 'active', operator: '==', value: true },
        { fn: 'isBefore', args: [{ field: 'startDate' }, { field: 'endDate' }] },
      ],
    });
    expect(evaluateExpression(node, { active: true }, fields, NOW)).toBe(true);
  });
});
