import { fieldLabel } from "../../naming";

/**
 * SwiftHelloScreenGenerator — structural, deterministic, 0% LLM (S2).
 * The skeleton's one screen: the app's display name + a hello line. Lives under
 * Sources/<AppName>/Features/ (§5.3 — Features/ owns SwiftUI screens/view state); a plain
 * `struct HelloView: View` is sufficient for S2 (brief §2.1 — no @Observable/@State needed yet).
 * `appName`/`greeting` are stored/computed properties (not just literals in `body`) so
 * swift_tests.ts can assert on the hello content without a view-inspection library.
 */
export function generateHelloScreen(ir: any): string {
  const displayName = fieldLabel(ir.name); // e.g. "work_auth" -> "Work Auth"
  return `// [generated] generator=SwiftHelloScreenGenerator template=swift_hello_screen.v1 class=structural ownership=generated
import SwiftUI

struct HelloView: View {
    let appName: String = "${displayName}"

    var greeting: String { "Hello, \\(appName)!" }

    var body: some View {
        VStack(spacing: 12) {
            Text(appName)
                .font(.title)
            Text(greeting)
                .font(.body)
        }
        .padding()
    }
}
`;
}
