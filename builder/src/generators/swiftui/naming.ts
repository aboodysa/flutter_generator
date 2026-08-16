import { capitalize } from "../../naming";

/**
 * Swift-specific naming (S2). `naming.ts`'s Dart helpers only go PascalCase/camelCase ->
 * snake_case (the OPPOSITE direction a Dart file name needs) — this is a genuinely new, additive
 * helper, not a duplicate of anything Dart-side (brief §2.1). Reuses `capitalize` (target-agnostic
 * string casing) per word segment so casing itself has one source of truth.
 *
 * "tasks" -> "Tasks", "work_auth" -> "WorkAuth", "hr_service" -> "HrService".
 */
export function swiftAppName(irName: string): string {
  const words = irName.split(/[^a-zA-Z0-9]+/).filter(Boolean).map(capitalize);
  const joined = words.join("");
  return /^[0-9]/.test(joined) ? `App${joined}` : joined || "App";
}
