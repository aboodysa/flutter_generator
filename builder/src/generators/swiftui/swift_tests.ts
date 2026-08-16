import { swiftAppName } from "./naming";
import { fieldLabel } from "../../naming";

/**
 * SwiftTestGenerator — structural, deterministic, 0% LLM (S2).
 * One trivial XCTest proving the skeleton compiles+links as a test target and the hello content
 * matches what the IR says it should be — nothing platform-bridging (brief §2.1), the smallest
 * possible instance of §6.5's "model serialization"-style focused-test posture.
 */
export function generateSwiftTests(ir: any): string {
  const name = swiftAppName(ir.name);
  const displayName = fieldLabel(ir.name);
  return `// [generated] generator=SwiftTestGenerator template=swift_tests.v1 class=structural ownership=generated
import XCTest
@testable import ${name}

final class ${name}Tests: XCTestCase {
    func testHelloViewShowsTheAppName() throws {
        let view = HelloView()
        XCTAssertEqual(view.appName, "${displayName}")
        XCTAssertEqual(view.greeting, "Hello, ${displayName}!")
    }
}
`;
}
