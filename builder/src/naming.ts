// Naming helpers — Dart identifier casing, shared by every generator (SRP slice of the former
// dart.ts grab-bag: this module owns casing/naming only, nothing else).

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function camelize(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// PascalCase/camelCase → snake_case file name (correct for multi-word names).
export function fileName(typeName: string): string {
  return `${typeName.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase()}.dart`;
}

// PascalCase/camelCase → kebab-case (e.g. TodoItem -> todo-item) — used for route paths.
export function kebab(typeName: string): string {
  return typeName.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

// The list-state collection field name derived from its entity (Transaction -> transactions,
// Task -> tasks, Product -> products) — single source so state.ts and screen.ts never drift.
export function collectionField(entity: string): string {
  return `${camelize(entity)}s`;
}

// A display label for a field (humanized snake/camelCase) — shared by screen.ts (detail rows)
// and crud_form.ts (form field labels) so both humanize field names identically.
export function fieldLabel(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// A humanized plural screen title for an entity ("Task" → "Tasks", "ExpenseClaim" → "Expense
// Claims") — replaces developer-facing class names like "TaskListScreen" in the app bar
// (UIX Slice B: domain-aware titles). Deterministic, same input → same title.
export function entityPluralTitle(entity: string): string {
  const base = fieldLabel(entity);
  return /[^aeiou]y$/i.test(entity) ? `${base.slice(0, -1)}ies` : `${base}s`;
}

// A fresh identity value for a newly-created entity — shared by crud_form.ts (create form
// submit) and state.ts (wizard finish()) so both entities get a real, unique id the same way.
export function newIdExpr(identityType: string): string {
  return identityType === "int" ? "DateTime.now().millisecondsSinceEpoch" : "DateTime.now().millisecondsSinceEpoch.toString()";
}
