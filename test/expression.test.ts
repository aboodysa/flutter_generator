import { normalizeExpression, normalizeValueExpression, compileExpression, fieldsInExpression } from '../builder/src/expression';
import { Field, RuleOperator } from '../builder/src/types';

// BREL Task 1 (BREL_TYPES_IMPL_BRIEF_CLAUDE.md) — canonical AST + normalization hardening tests
// for builder/src/expression.ts, which had none before this slice. Pure unit tests, no generator
// invocation (contrast with test/s3_assets.test.ts's real-CLI style — expression.ts is a pure
// (RuleExpression, Field[]) -> string function with no I/O to exercise end-to-end).

const fields: Field[] = [
  { name: 'id', type: 'String', required: true },
  { name: 'amount', type: 'double', semanticType: 'Money', currency: 'SAR' },
  { name: 'startDate', type: 'DateTime' },
  { name: 'endDate', type: 'DateTime' },
  { name: 'status', type: 'enum', of: 'OrderStatus' },
  { name: 'title', type: 'String' },
];

describe('normalizeExpression — every supported operator (flat RuleCondition shape)', () => {
  const operators: RuleOperator[] = [
    '>=', '<=', '>', '<', '==', '!=', 'contains',
    'startsWith', 'endsWith', 'matches', 'in', 'notIn',
    'isNull', 'isNotNull', 'isEmpty', 'isNotEmpty',
  ];

  test.each(operators)('%s normalizes flat {field,operator,value} to Comparison(left,op,right)', (op) => {
    const normalized = normalizeExpression({ field: 'title', operator: op, value: 'x' });
    expect(normalized).toEqual({ left: { field: 'title' }, op, right: { value: 'x' } });
  });

  test('already-canonical {left,op,right} passes through unchanged (recursively normalized)', () => {
    const input = { left: { field: 'amount' }, op: '>=' as RuleOperator, right: { value: 100 } };
    expect(normalizeExpression(input)).toEqual(input);
  });
});

describe('normalizeExpression — nested and/or/not (incl. mixed depth)', () => {
  test('flat or of two comparisons', () => {
    const input = {
      or: [
        { field: 'status', operator: '==', value: 'a' },
        { field: 'status', operator: '==', value: 'b' },
      ],
    };
    expect(normalizeExpression(input)).toEqual({
      or: [
        { left: { field: 'status' }, op: '==', right: { value: 'a' } },
        { left: { field: 'status' }, op: '==', right: { value: 'b' } },
      ],
    });
  });

  test('and of a not-wrapped or (mixed depth, 3 levels)', () => {
    const input = {
      and: [
        { field: 'id', operator: '!=', value: '' },
        {
          not: {
            or: [
              { field: 'status', operator: '==', value: 'rejected' },
              { field: 'status', operator: '==', value: 'draft' },
            ],
          },
        },
      ],
    };
    const out = normalizeExpression(input);
    expect(out).toHaveProperty('and');
    const andNode = out as { and: unknown[] };
    expect(andNode.and).toHaveLength(2);
    expect(andNode.and[1]).toHaveProperty('not');
    const notNode = andNode.and[1] as { not: { or: unknown[] } };
    expect(notNode.not.or).toHaveLength(2);
  });
});

describe('normalizeExpression — field refs and function calls', () => {
  test('value-kind fn nested inside a Comparison left/right', () => {
    const input = {
      left: { fn: 'daysSince', args: [{ field: 'endDate' }] },
      op: '>' as RuleOperator,
      right: { value: 0 },
    };
    expect(normalizeExpression(input)).toEqual({
      left: { fn: 'daysSince', args: [{ field: 'endDate' }] },
      op: '>',
      right: { value: 0 },
    });
  });

  test('predicate-kind fn as a bare leaf (no comparison operator)', () => {
    const input = { fn: 'isBefore', args: [{ field: 'startDate' }, { field: 'endDate' }] };
    expect(normalizeExpression(input)).toEqual({
      fn: 'isBefore',
      args: [{ field: 'startDate' }, { field: 'endDate' }],
    });
  });

  test('normalizeValueExpression accepts {field}, {value}, {fn,args} and recurses into fn args', () => {
    expect(normalizeValueExpression({ field: 'title' })).toEqual({ field: 'title' });
    expect(normalizeValueExpression({ value: 42 })).toEqual({ value: 42 });
    expect(normalizeValueExpression({ fn: 'daysSince', args: [{ field: 'endDate' }] })).toEqual({
      fn: 'daysSince',
      args: [{ field: 'endDate' }],
    });
  });
});

describe('normalizeExpression — flat -> nested normalization, all 4 accepted input shapes', () => {
  test('1. already-canonical Comparison {left,op,right}', () => {
    const input = { left: { field: 'title' }, op: 'contains' as RuleOperator, right: { value: 'x' } };
    expect(normalizeExpression(input)).toEqual(input);
  });

  test('2. flat fn-comparison {fn,args,op,value}', () => {
    const input = { fn: 'daysSince', args: [{ field: 'endDate' }], op: '>', value: 0 };
    expect(normalizeExpression(input)).toEqual({
      left: { fn: 'daysSince', args: [{ field: 'endDate' }] },
      op: '>',
      right: { value: 0 },
    });
  });

  test('3. bare predicate fn call {fn,args}', () => {
    const input = { fn: 'isBefore', args: [{ field: 'startDate' }, { field: 'endDate' }] };
    expect(normalizeExpression(input)).toEqual({
      fn: 'isBefore',
      args: [{ field: 'startDate' }, { field: 'endDate' }],
    });
  });

  test('4. flat RuleCondition shape {field,operator,value}', () => {
    const input = { field: 'status', operator: '==', value: 'draft' };
    expect(normalizeExpression(input)).toEqual({
      left: { field: 'status' },
      op: '==',
      right: { value: 'draft' },
    });
  });
});

describe('normalizeExpression — malformed expressions throw', () => {
  test('missing field/op/right (an object with none of the recognized shapes)', () => {
    expect(() => normalizeExpression({ foo: 'bar' })).toThrow(/unrecognized expression shape/);
  });

  test('null/non-object node', () => {
    expect(() => normalizeExpression(null)).toThrow(/invalid expression node/);
    expect(() => normalizeExpression('x')).toThrow(/invalid expression node/);
  });

  test('value expression missing field/value/fn', () => {
    expect(() => normalizeValueExpression({})).toThrow(/value expression missing field\/value\/fn/);
  });

  test('unknown fn surfaces at compile time (normalize does not validate fn names)', () => {
    const normalized = normalizeExpression({ fn: 'sumOf', args: [{ field: 'amount' }] });
    expect(() => compileExpression(normalized, fields)).toThrow(/unknown fn 'sumOf'/);
  });
});

describe('compileExpression — every supported operator emits the expected Dart fragment', () => {
  const cases: [RuleOperator, string, unknown, RegExp][] = [
    ['>=', 'title', 'x', /e\.title >= 'x'/],
    ['<=', 'title', 'x', /e\.title <= 'x'/],
    ['>', 'title', 'x', /e\.title > 'x'/],
    ['<', 'title', 'x', /e\.title < 'x'/],
    ['==', 'title', 'x', /e\.title == 'x'/],
    ['!=', 'title', 'x', /e\.title != 'x'/],
    ['contains', 'title', 'x', /e\.title\.contains\('x'\)/],
    ['startsWith', 'title', 'x', /e\.title\.startsWith\('x'\)/],
    ['endsWith', 'title', 'x', /e\.title\.endsWith\('x'\)/],
    ['matches', 'title', 'x', /RegExp\('x'\)\.hasMatch\(e\.title\)/],
    ['in', 'title', ['a', 'b'], /\[.*\]\.contains\(e\.title\)/],
    ['notIn', 'title', ['a', 'b'], /!\[.*\]\.contains\(e\.title\)/],
    ['isNull', 'title', null, /e\.title == null/],
    ['isNotNull', 'title', null, /e\.title != null/],
    ['isEmpty', 'title', null, /e\.title\.isEmpty/],
    ['isNotEmpty', 'title', null, /e\.title\.isNotEmpty/],
  ];

  test.each(cases)('%s', (op, field, value, expected) => {
    const node = normalizeExpression({ field, operator: op, value });
    expect(compileExpression(node, fields)).toMatch(expected);
  });

  test('Money field compiles to .minorUnits with an integer literal', () => {
    const node = normalizeExpression({ field: 'amount', operator: '>=', value: 100 });
    expect(compileExpression(node, fields)).toBe('e.amount.minorUnits >= 10000');
  });

  test('enum field compiles the literal to EnumType.member', () => {
    const node = normalizeExpression({ field: 'status', operator: '==', value: 'draft' });
    expect(compileExpression(node, fields)).toBe('e.status == OrderStatus.draft');
  });
});

describe('compileExpression — nested and/or/not', () => {
  test('and/or/not all compile to their Dart boolean-combinator form', () => {
    const node = normalizeExpression({
      and: [
        { field: 'id', operator: '!=', value: '' },
        { not: { field: 'status', operator: '==', value: 'rejected' } },
      ],
    });
    const dart = compileExpression(node, fields);
    expect(dart).toContain('&&');
    expect(dart).toContain('!(e.status == OrderStatus.rejected)');
  });

  test('or of two comparisons (choice_demo AnswerAcceptable shape)', () => {
    const node = normalizeExpression({
      or: [
        { field: 'status', operator: '==', value: 'a' },
        { field: 'status', operator: '==', value: 'b' },
      ],
    });
    const dart = compileExpression(node, fields);
    expect(dart).toContain('||');
  });
});

describe('compileExpression — function calls', () => {
  test('value-kind fn (daysSince) inside a Comparison', () => {
    const node = normalizeExpression({ fn: 'daysSince', args: [{ field: 'endDate' }], op: '>', value: 0 });
    expect(compileExpression(node, fields)).toBe('DateTime.now().difference(e.endDate).inDays > 0');
  });

  test('predicate-kind fn (isBefore) as a bare leaf', () => {
    const node = normalizeExpression({ fn: 'isBefore', args: [{ field: 'startDate' }, { field: 'endDate' }] });
    expect(compileExpression(node, fields)).toBe('e.startDate.isBefore(e.endDate)');
  });

  test('isBetween compiles to the two-sided Dart form', () => {
    const node = normalizeExpression({
      fn: 'isBetween',
      args: [{ field: 'startDate' }, { field: 'startDate' }, { field: 'endDate' }],
    });
    expect(compileExpression(node, fields)).toBe('(e.startDate.isAfter(e.startDate) && e.startDate.isBefore(e.endDate))');
  });

  test('a value-kind fn used as a bare leaf throws (must be nested in a Comparison)', () => {
    const node = { fn: 'daysSince', args: [{ field: 'endDate' }] };
    expect(() => compileExpression(node, fields)).toThrow(/value-kind — it must appear inside a Comparison/);
  });
});

describe('fieldsInExpression — trust-boundary field collection', () => {
  test('collects fields from nested combinators, comparisons, and fn args', () => {
    const node = normalizeExpression({
      and: [
        { field: 'id', operator: '!=', value: '' },
        { fn: 'isBefore', args: [{ field: 'startDate' }, { field: 'endDate' }] },
      ],
    });
    expect(fieldsInExpression(node).sort()).toEqual(['endDate', 'id', 'startDate']);
  });
});
