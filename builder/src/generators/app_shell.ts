import { ShellPattern } from "../composition";

/**
 * AppShellGenerator — structural (pattern), deterministic, 0% LLM (P1, INTERFACE_PATTERN_CONTRACT.md §3).
 * Emits `core/app_shell.dart` once per multi-feature app whose composition layer decided a shell
 * exists (composition.ts's `shellFor` — the only owner of that decision; this generator only
 * renders the payload it's handed, per contract §1). Pure `(ShellPattern, ctx) -> string`, no I/O.
 *
 * `AppShell` is the `builder:` for RouteGenerator's `StatefulShellRoute.indexedStack` — it wraps
 * the currently-active branch's own `Navigator` (`navigationShell`) in a bottom `NavigationBar`
 * whose destinations come straight from the decided `ShellPattern`, in `features[]` order.
 * Tapping the already-selected destination resets that branch to its initial location (the
 * standard go_router `goBranch` recipe); tapping another preserves every branch's own stack.
 */
export function generateAppShell(pattern: ShellPattern): string {
  const destinations = pattern.branches
    .map((b) => `          NavigationDestination(icon: Icon(${b.icon}), label: '${b.title}'), // feature: ${b.featureId}`)
    .join("\n");

  return `// [generated] generator=AppShellGenerator template=app_shell.v1 class=pattern ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) => navigationShell.goBranch(
          index,
          initialLocation: index == navigationShell.currentIndex,
        ),
        destinations: const [
${destinations}
        ],
      ),
    );
  }
}
`;
}
