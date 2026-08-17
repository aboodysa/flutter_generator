/**
 * S-HERMETIC (design/flutter-app-builder/research/S_HERMETIC_IMPL_BRIEF_CLAUDE.md,
 * SPIKE_S_HERMETIC_REPORT.md §13 D1/D2): the single declared toolchain floor, shared by the
 * generated `pubspec.yaml` (`generators/project.ts`) and the `[lockfile]` validate gate
 * (`validate.ts`) so the two can never drift apart the way `pubspec.yaml`'s old `sdk: ^3.0.0` and
 * every committed lock's proven `dart >=3.11.0` did. Full record + rationale: `FLUTTER_TOOLCHAIN.md`.
 *
 * Ratified (implementation brief #1): the floor is what every committed `pubspec.lock`'s `sdks:`
 * block already proves, not the newer exact-installed version (`SWIFTUI_GROUND_TRUTH.md:91-93`
 * records Dart 3.12.2/Flutter 3.44.3 as the *installed* toolchain — that's above this floor, not
 * equal to it).
 */
export const DART_SDK_FLOOR = ">=3.11.0 <4.0.0";
export const FLUTTER_SDK_FLOOR = ">=3.38.4";
