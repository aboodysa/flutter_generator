/**
 * SwiftUIGenContext — the Swift target's analogue of gen_context.ts's GenContext. A SEPARATE,
 * minimal type (ISP, brief §2.6) rather than reusing the Dart GenContext, whose `pkg`/`symbols`
 * fields are Flutter/Dart package-path concepts that do not apply to a Swift target. S2's skeleton
 * needs nothing beyond the IR itself; this exists so S3+ (which will need a Swift symbol-table
 * analogue for cross-file references) can extend it additively without changing
 * generateSwiftUITarget's signature.
 */
export interface SwiftUIGenContext {
  readonly ir: any;
}
