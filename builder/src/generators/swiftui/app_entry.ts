import { swiftAppName } from "./naming";

/**
 * SwiftAppEntryGenerator — structural, deterministic, 0% LLM (S2).
 * The `@main` SwiftUI `App` struct + `WindowGroup` presenting HelloView. This file and
 * hello_screen.ts are the only S2 files that `import SwiftUI` — App.swift IS the platform entry
 * point (not a Domain-layer concern), so [swiftarch]'s Domain-only import restriction (§6.3) does
 * not apply to it.
 */
export function generateAppEntry(ir: any): string {
  const name = swiftAppName(ir.name);
  return `// [generated] generator=SwiftAppEntryGenerator template=swift_app_entry.v1 class=structural ownership=generated
import SwiftUI

@main
struct ${name}App: App {
    var body: some Scene {
        WindowGroup {
            HelloView()
        }
    }
}
`;
}
