// Barrel re-export — dart.ts used to be a 7-concern grab-bag (naming, Dart type-mapping,
// nullability, VO/entity lookup, sample-data synthesis, import resolution, and the GenContext
// type itself). Split into cohesive modules below; this file re-exports them all so existing
// `import { X } from "../dart"` / `from "./dart"` call sites keep working unchanged (additive,
// no import churn). New code should prefer importing directly from the specific module.
export * from "./naming";
export * from "./dart_types";
export * from "./nullability";
export * from "./sampling";
export * from "./imports";
export * from "./gen_context";
