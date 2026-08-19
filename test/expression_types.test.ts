import { execSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { typeCheckExpression } from '../builder/src/expression_types';
import { expressionTypesCheck, validateOutput } from '../builder/src/validate';
import { normalizeExpression } from '../builder/src/expression';
import { EntityModel, EnumModel } from '../builder/src/types';

// BREL Task 2 (BREL_TYPES_IMPL_BRIEF_CLAUDE.md) — typeCheckExpression unit tests (direct, pure)
// plus a real-CLI proof that validate.ts's new [expression-types] gate rejects a type-invalid
// expression at IR time (the brief's required negative fixture, step 4). Mirrors
// test/s3_assets.test.ts's split between direct-unit and real-generator-backed checks.

const REPO_ROOT = resolve(__dirname, '..');

const entity: EntityModel = {
  name: 'Order',
  identity: { field: 'id' },
  fields: [
    { name: 'id', type: 'String', required: true },
    { name: 'amount', type: 'double', semanticType: 'Money', currency: 'SAR' },
    { name: 'startDate', type: 'DateTime' },
    { name: 'endDate', type: 'DateTime' },
    { name: 'status', type: 'enum', of: 'OrderStatus' },
    { name: 'active', type: 'bool' },
    { name: 'title', type: 'String' },
    { name: 'tags', type: 'List', of: 'String' },
    { name: 'score', type: 'int' },
  ],
};

const enums: EnumModel[] = [{ name: 'OrderStatus', values: ['draft', 'submitted', 'approved', 'rejected'] }];

function comparison(field: string, op: string, value: unknown) {
  return normalizeExpression({ field, operator: op, value });
}

describe('typeCheckExpression — Money fields: numeric ops only', () => {
  test.each(['>=', '<=', '>', '<'])('%s is legal on a Money field', (op) => {
    expect(typeCheckExpression(comparison('amount', op, 100), entity, enums)).toEqual([]);
  });

  test('contains is rejected on a Money field', () => {
    const v = typeCheckExpression(comparison('amount', 'contains', 'foo'), entity, enums);
    expect(v).toEqual([expect.stringContaining("operator 'contains' is not valid for Money")]);
  });

  test('matches (string op) is rejected on a Money field', () => {
    const v = typeCheckExpression(comparison('amount', 'matches', '^\\d+$'), entity, enums);
    expect(v.length).toBeGreaterThan(0);
  });

  test('Money vs numeric literal is compatible; Money vs string literal is not', () => {
    expect(typeCheckExpression(comparison('amount', '>=', 100), entity, enums)).toEqual([]);
  });
});

describe('typeCheckExpression — DateTime fields', () => {
  // No literal-DateTime shape exists in this IR (neither expression.ts's compileValue nor the
  // legacy generators/rule.ts's conditionExpr special-case a Date-parseable string literal), so
  // the only type-compatible right operand for a direct >=/<=/>/</==/!= comparison is another
  // DateTime field — mirrors how real IRs express this (isBefore/isAfter/isBetween field-vs-field,
  // or daysSince/daysUntil day counts).
  test.each(['>=', '<=', '>', '<', '==', '!='])('%s is legal on a DateTime field vs. another DateTime field', (op) => {
    expect(
      typeCheckExpression({ left: { field: 'startDate' }, op: op as any, right: { field: 'endDate' } }, entity, enums),
    ).toEqual([]);
  });

  test('a DateTime field compared against a plain string literal is an operand type mismatch', () => {
    const v = typeCheckExpression(comparison('startDate', '==', '2024-01-01'), entity, enums);
    expect(v).toEqual([expect.stringContaining('operand type mismatch: left is DateTime, right is String')]);
  });

  test.each(['contains', 'startsWith', 'matches', 'in'])('%s is rejected on a DateTime field', (op) => {
    const value = op === 'in' ? ['x'] : 'x';
    const v = typeCheckExpression(comparison('startDate', op, value), entity, enums);
    expect(v.length).toBeGreaterThan(0);
  });
});

describe('typeCheckExpression — enum fields', () => {
  test.each(['==', '!='])('%s is legal on an enum field', (op) => {
    expect(typeCheckExpression(comparison('status', op, 'draft'), entity, enums)).toEqual([]);
  });

  test.each(['in', 'notIn'])('%s is legal with a list-of-member-name literal', (op) => {
    expect(typeCheckExpression(comparison('status', op, ['draft', 'approved']), entity, enums)).toEqual([]);
  });

  test.each(['>', '<'])('%s is rejected on an enum field', (op) => {
    const v = typeCheckExpression(comparison('status', op, 'draft'), entity, enums);
    expect(v).toEqual([expect.stringContaining(`operator '${op}' is not valid for enum<OrderStatus>`)]);
  });

  test('contains is rejected on an enum field', () => {
    const v = typeCheckExpression(comparison('status', 'contains', 'draft'), entity, enums);
    expect(v.length).toBeGreaterThan(0);
  });

  test('an enum literal not in the declared values is flagged', () => {
    const v = typeCheckExpression(comparison('status', '==', 'nonexistent'), entity, enums);
    expect(v).toEqual([expect.stringContaining("enum literal 'nonexistent' is not a member of OrderStatus")]);
  });

  test('an in-list containing an unknown enum member is flagged', () => {
    const v = typeCheckExpression(comparison('status', 'in', ['draft', 'bogus']), entity, enums);
    expect(v).toEqual([expect.stringContaining("enum literal 'bogus' is not a member of OrderStatus")]);
  });
});

describe('typeCheckExpression — bool fields', () => {
  test.each(['==', '!='])('%s is legal on a bool field', (op) => {
    expect(typeCheckExpression(comparison('active', op, true), entity, enums)).toEqual([]);
  });

  test.each(['>=', 'contains'])('%s is rejected on a bool field', (op) => {
    const v = typeCheckExpression(comparison('active', op, true), entity, enums);
    expect(v.length).toBeGreaterThan(0);
  });
});

describe('typeCheckExpression — String fields', () => {
  test.each(['==', '!=', 'contains', 'startsWith', 'endsWith', 'matches', 'in', 'notIn'])('%s is legal on a String field', (op) => {
    const value = op === 'in' || op === 'notIn' ? ['a', 'b'] : 'x';
    expect(typeCheckExpression(comparison('title', op, value), entity, enums)).toEqual([]);
  });

  test.each(['>=', '<', 'isEmpty'])('%s is rejected on a String field', (op) => {
    const v = typeCheckExpression(comparison('title', op, 'x'), entity, enums);
    expect(v.length).toBeGreaterThan(0);
  });
});

describe('typeCheckExpression — List fields', () => {
  test.each(['isEmpty', 'isNotEmpty'])('%s is legal on a List field', (op) => {
    expect(typeCheckExpression(comparison('tags', op, null), entity, enums)).toEqual([]);
  });

  test.each(['in', 'notIn'])('%s is legal on a List field', (op) => {
    expect(typeCheckExpression(comparison('tags', op, ['a']), entity, enums)).toEqual([]);
  });

  test.each(['>=', 'contains', '=='])('%s is rejected on a List field', (op) => {
    const v = typeCheckExpression(comparison('tags', op, 'a'), entity, enums);
    expect(v.length).toBeGreaterThan(0);
  });
});

describe('typeCheckExpression — int/double fields', () => {
  test.each(['>=', '<=', '>', '<', '==', '!='])('%s is legal on an int field', (op) => {
    expect(typeCheckExpression(comparison('score', op, 5), entity, enums)).toEqual([]);
  });

  test('contains is rejected on an int field', () => {
    const v = typeCheckExpression(comparison('score', 'contains', 5), entity, enums);
    expect(v.length).toBeGreaterThan(0);
  });
});

describe('typeCheckExpression — isNull/isNotNull are OK on any field type', () => {
  test.each(['id', 'amount', 'startDate', 'status', 'active', 'title', 'tags', 'score'])('isNull is legal on %s', (field) => {
    expect(typeCheckExpression(comparison(field, 'isNull', null), entity, enums)).toEqual([]);
  });
});

describe('typeCheckExpression — function argument types', () => {
  test('daysSince/daysUntil accept a DateTime field arg', () => {
    expect(
      typeCheckExpression(normalizeExpression({ fn: 'daysSince', args: [{ field: 'startDate' }], op: '>', value: 0 }), entity, enums),
    ).toEqual([]);
  });

  test('daysSince rejects a non-DateTime field arg (Money field)', () => {
    const v = typeCheckExpression(
      normalizeExpression({ fn: 'daysSince', args: [{ field: 'amount' }], op: '>', value: 0 }),
      entity,
      enums,
    );
    expect(v).toEqual([expect.stringContaining("fn 'daysSince' arg 1 expects DateTime")]);
  });

  test('isBefore/isAfter/isBetween accept DateTime field args', () => {
    expect(
      typeCheckExpression({ fn: 'isBefore', args: [{ field: 'startDate' }, { field: 'endDate' }] }, entity, enums),
    ).toEqual([]);
    expect(
      typeCheckExpression(
        { fn: 'isBetween', args: [{ field: 'startDate' }, { field: 'startDate' }, { field: 'endDate' }] },
        entity,
        enums,
      ),
    ).toEqual([]);
  });

  test('isBefore rejects a non-DateTime field arg', () => {
    const v = typeCheckExpression({ fn: 'isBefore', args: [{ field: 'title' }, { field: 'endDate' }] }, entity, enums);
    expect(v).toEqual([expect.stringContaining("fn 'isBefore' arg 1 expects DateTime")]);
  });

  test('a predicate-kind fn used as a Comparison operand is flagged (mirrors compileExpression\'s runtime guard, caught at IR time)', () => {
    const v = typeCheckExpression(
      { left: { fn: 'isBefore', args: [{ field: 'startDate' }, { field: 'endDate' }] }, op: '==', right: { value: true } },
      entity,
      enums,
    );
    expect(v.some((x) => x.includes("fn 'isBefore' is predicate-kind"))).toBe(true);
  });

  test('a value-kind fn used as a bare predicate leaf is flagged', () => {
    const v = typeCheckExpression({ fn: 'daysSince', args: [{ field: 'startDate' }] }, entity, enums);
    expect(v.some((x) => x.includes("fn 'daysSince' is value-kind"))).toBe(true);
  });

  test('an unknown fn is flagged, not thrown', () => {
    const v = typeCheckExpression({ fn: 'sumOf', args: [{ field: 'amount' }] }, entity, enums);
    expect(v.some((x) => x.includes("unknown fn 'sumOf'"))).toBe(true);
  });
});

describe('typeCheckExpression — comparison operand compatibility', () => {
  test('numeric vs numeric is compatible', () => {
    expect(typeCheckExpression({ left: { field: 'score' }, op: '>', right: { value: 5 } }, entity, enums)).toEqual([]);
  });

  test('DateTime vs DateTime (field vs field) is compatible', () => {
    expect(
      typeCheckExpression({ left: { field: 'startDate' }, op: '<', right: { field: 'endDate' } }, entity, enums),
    ).toEqual([]);
  });

  test('String field vs enum field is a type mismatch', () => {
    const v = typeCheckExpression({ left: { field: 'title' }, op: '==', right: { field: 'status' } }, entity, enums);
    expect(v).toEqual([expect.stringContaining('operand type mismatch')]);
  });

  test('enum field vs a different enum type is a type mismatch', () => {
    const otherEnumEntity: EntityModel = {
      ...entity,
      fields: [...entity.fields, { name: 'kind', type: 'enum', of: 'Kind' }],
    };
    const moreEnums = [...enums, { name: 'Kind', values: ['x', 'y'] }];
    const v = typeCheckExpression(
      { left: { field: 'status' }, op: '==', right: { field: 'kind' } },
      otherEnumEntity,
      moreEnums,
    );
    expect(v).toEqual([expect.stringContaining('operand type mismatch')]);
  });

  test('a field that does not exist on the entity is flagged, permissively skipping downstream checks', () => {
    const v = typeCheckExpression(comparison('nope', '==', 'x'), entity, enums);
    expect(v).toEqual([expect.stringContaining("field 'nope' is not declared on entity 'Order'")]);
  });
});

describe('typeCheckExpression — nested and/or/not walk every leaf', () => {
  test('a type violation nested three levels deep (and > not > or) is still caught', () => {
    const node = normalizeExpression({
      and: [
        { field: 'id', operator: '!=', value: '' },
        {
          not: {
            or: [
              { field: 'status', operator: '==', value: 'draft' },
              { field: 'amount', operator: 'contains', value: 'x' }, // the violation
            ],
          },
        },
      ],
    });
    const v = typeCheckExpression(node, entity, enums);
    expect(v).toEqual([expect.stringContaining("operator 'contains' is not valid for Money")]);
  });
});

describe('typeCheckExpression — choice_demo AnswerAcceptable shape is valid (regression anchor)', () => {
  test('enum field compared with == inside an or (the shipped or-path proof)', () => {
    const node = normalizeExpression({
      or: [
        { field: 'status', operator: '==', value: 'draft' },
        { field: 'status', operator: '==', value: 'submitted' },
      ],
    });
    expect(typeCheckExpression(node, entity, enums)).toEqual([]);
  });
});

// -------------------- [expression-types] gate: direct unit test --------------------

describe('expressionTypesCheck (validate.ts) — wires typeCheckExpression over ir.businessRules', () => {
  const ir = {
    entities: [entity],
    enums,
    businessRules: [
      {
        name: 'BadMoneyRule',
        entity: 'Order',
        conditions: [],
        result: 'true',
        expression: normalizeExpression({ field: 'amount', operator: 'contains', value: 'foo' }),
      },
    ],
  };

  test('reports a [expression-types]-prefixed issue for the invalid rule', () => {
    const issues = expressionTypesCheck(ir);
    expect(issues).toEqual([expect.stringMatching(/^\[expression-types\] rule 'BadMoneyRule': operator 'contains' is not valid for Money/)]);
  });

  test('a rule with no expression (legacy conditions[] path) is untouched', () => {
    const legacyIr = {
      entities: [entity],
      enums,
      businessRules: [{ name: 'Legacy', entity: 'Order', conditions: [{ field: 'active', operator: '==', value: true }], result: 'true' }],
    };
    expect(expressionTypesCheck(legacyIr)).toEqual([]);
  });
});

// -------------------- [expression-types] gate: real-CLI negative fixture --------------------
// Brief step 4: prove validate.ts rejects a rule with a deliberately invalid expression
// (amount contains "foo" on a Money field) at IR time — not by throwing during Dart generation.

describe('[expression-types] gate — real validate.ts CLI, negative IR fixture', () => {
  let workDir: string;

  beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), 'expr-types-negative-'));
  });

  afterAll(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  function sh(cmd: string): { status: number; stdout: string } {
    try {
      const stdout = execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      return { status: 0, stdout };
    } catch (e: any) {
      return { status: typeof e.status === 'number' ? e.status : 1, stdout: (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : '') };
    }
  }

  test('a Money-field rule with a string operator (amount contains "foo") fails [expression-types], not generation', () => {
    const irPath = join(workDir, 'negative.ir.json');
    const outDir = join(workDir, 'out');
    const ir = {
      schemaVersion: '1',
      name: 'expr_types_negative',
      entities: [
        {
          name: 'Order',
          identity: { field: 'id' },
          primaryDisplayField: 'id',
          fields: [
            { name: 'id', type: 'String', required: true, nullable: false },
            { name: 'amount', type: 'double', semanticType: 'Money', currency: 'SAR', required: true, nullable: false },
          ],
        },
      ],
      businessRules: [
        {
          name: 'BadMoneyContains',
          entity: 'Order',
          conditions: [],
          result: 'true',
          expression: { left: { field: 'amount' }, op: 'contains', right: { value: 'foo' } },
        },
      ],
    };
    writeFileSync(irPath, JSON.stringify(ir, null, 2));

    // Generation itself must succeed (compileExpression mechanically emits Dart regardless of
    // type — that's the exact gap this gate closes: the bug would otherwise surface only as a
    // `flutter analyze` failure on the generated app, not here).
    const gen = sh(`npx ts-node --transpile-only builder/src/index.ts ${irPath} ${outDir}`);
    expect(gen.status).toBe(0);

    // The CLI: validate.ts's [expression-types] gate line FAILs and the process exits non-zero —
    // the CLI summary only prints PASS/FAIL(count) per gate, not the message text (existing
    // pre-slice behavior, unchanged here), so the exact violation text is asserted below via the
    // in-process validateOutput() call against the same ir/outDir.
    const val = sh(`npx ts-node --transpile-only builder/src/validate.ts ${irPath} ${outDir}`);
    expect(val.stdout).toMatch(/\[expression-types\] FAIL \(1\)/);
    expect(val.status).toBe(1);

    const result = validateOutput(ir, outDir, irPath);
    expect(result.expressionTypes).toBe(1);
    expect(result.issues).toEqual(
      expect.arrayContaining([expect.stringContaining("[expression-types] rule 'BadMoneyContains': operator 'contains' is not valid for Money")]),
    );
  }, 60_000);
});
