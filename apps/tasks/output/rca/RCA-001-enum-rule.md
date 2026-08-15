# RCA-001 — rule generator emits bare enum member instead of qualified constant

App: tasks (apps/tasks/)
Date: 2026-08-15
Severity: p1 (generated code fails to compile for ANY rule comparing an enum field)

## Symptom
`flutter analyze` on the generated tasks app failed:
```
lib/features/tasks/domain/rules/high_priority.dart:7:26 · error · Undefined name 'high'
```
Generated: `return e.priority == high;` — the enum member name from the IR is emitted bare,
without its enum type qualifier, so it resolves as a top-level identifier instead of a Dart enum
constant.

## Root cause
`builder/src/generators/rule.ts` → `conditionExpr()` built the right-hand operand purely from the
IR `value` string (`c.value`). It special-cased money fields (`.minorUnits` + ×100 scaling) but had
no branch for `enum`-typed fields. IR stores enum comparisons as member names (`value: "high"`),
which only compile when qualified (`Priority.high`). No existing sample (expense.semantic,
reimbursement, wizard, todo) compared an enum field in a business rule, so the gap went unexercised
until the tasks sample declared `HighPriority` over `Task.priority`.

## Fix
`conditionExpr()` now detects an enum field (`fieldDef.type === "enum"`) and qualifies the value as
`${EnumType}.${value}` using `fieldDef.of` (falling back to the capitalized field name), the same
convention the CRUD form / wizard inputs already use for enum dropdowns. Money handling unchanged.

## Verification
- `npm run typecheck:builder` → clean.
- Regenerate tasks: `high_priority.dart` now emits `return e.priority == Priority.high;`
- `apps/tasks/` validate → VALIDATION PASSED (all gates incl oracle).

## Prevention
When writing a rule generator, every non-primitive field kind (money, enum, VO, DateTime) must be
mapped to a valid Dart operand expression — a compile-check of a generated rule over each field
kind is a cheap regression guard.
