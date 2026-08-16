import { swiftAppName } from "./naming";
import { generatePackageSwift } from "./swift_package";
import { generateAppEntry } from "./app_entry";
import { generateHelloScreen } from "./hello_screen";
import { generateSwiftTests } from "./swift_tests";
import type { SwiftUIGenContext } from "./context";
export type { SwiftUIGenContext } from "./context";

/** Files relative to `<outDir>/ios/` — the only shape index.ts needs to know to write them. */
export interface SwiftUIProject {
  files: { path: string; content: string }[];
}

/**
 * SwiftUI target barrel (S2) — the ONLY entry index.ts calls for a swiftui-target IR. Mirrors the
 * existing Flutter generators' pure `(IR, ctx) -> string` discipline: every file in this module is
 * a pure function, no I/O (index.ts confines all filesystem writes, brief §2.2).
 */
export function generateSwiftUITarget(ir: any, _ctx: SwiftUIGenContext): SwiftUIProject {
  const name = swiftAppName(ir.name);
  return {
    files: [
      { path: "Package.swift", content: generatePackageSwift(ir) },
      { path: `Sources/${name}/App.swift`, content: generateAppEntry(ir) },
      { path: `Sources/${name}/Features/HelloView.swift`, content: generateHelloScreen(ir) },
      { path: `Tests/${name}Tests/${name}Tests.swift`, content: generateSwiftTests(ir) },
    ],
  };
}
