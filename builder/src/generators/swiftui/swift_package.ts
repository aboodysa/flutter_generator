import { swiftAppName } from "./naming";

/**
 * SwiftPackageGenerator — structural, deterministic, 0% LLM (S2).
 * Emits Package.swift for the one generated SPM application package (§5.3 — no premature
 * per-layer package split for V1).
 *
 * CORRECTION (S2 deliverable §4; requirements §5.1 vs ground truth §18): requirements §5.1's
 * literal snippet shows a `.library`/`.target` pair, but a `@main` SwiftUI `App` (app_entry.ts)
 * only becomes a real, launchable entry point in an EXECUTABLE module — ground truth §18 already
 * recommends "an app executable + XCTest target" for exactly this reason. Gate B (§6.4) has to
 * prove "the generated iOS SwiftUI application builds," not merely "this Swift compiles as a
 * library." Verified empirically against the host toolchain (Xcode 26.3 / Swift 6.2.4):
 * `.executableTarget` + an `.executable` product builds cleanly for both Gate A (`swift build` /
 * `swift test`) and Gate B (`xcodebuild ... -sdk iphonesimulator`).
 *
 * `platforms:` also adds `.macOS(.v14)` alongside the required `.iOS(.v17)` (correction 3,
 * §5.1.1) — SwiftUI's `App`/`Scene`/`WindowGroup` types need macOS 11+ to type-check, and Gate A
 * (`swift build`) compiles for the host Mac with no destination pinned. Omitting a macOS floor
 * leaves it at SwiftPM's old pre-11 default and Gate A fails outright. `.iOS(.v17)` stays the
 * first `platforms: [` entry, satisfying the `[swiftpkg]` gate's check.
 *
 * The `swift-tools-version` comment must be the literal first line of the file (an SPM hard
 * requirement, not a style choice) — the `[generated]` header is the second line instead of the
 * usual first line every other generated file uses.
 */
export function generatePackageSwift(ir: any): string {
  const name = swiftAppName(ir.name);
  return `// swift-tools-version:5.9
// [generated] generator=SwiftPackageGenerator template=swift_package.v1 class=structural ownership=generated
import PackageDescription

let package = Package(
    name: "${name}",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .executable(name: "${name}", targets: ["${name}"])
    ],
    targets: [
        .executableTarget(name: "${name}"),
        .testTarget(name: "${name}Tests", dependencies: ["${name}"])
    ]
)
`;
}
