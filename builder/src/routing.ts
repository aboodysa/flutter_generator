// Shared route-path derivation — used by RouteGenerator (route.ts) to register go_router routes
// AND by ScreenGenerator (screen.ts) to build the matching onTap navigation target, so the two
// can never drift apart (SOLID review #1: route paths used to collide across same-type screens
// because paths were derived from `s.type` alone, ignoring the entity).
import { ScreenModel } from "./types";
import { kebab } from "./naming";

// list screen   -> /<kebab(entity)>
// detail screen -> /<kebab(entity)>/:id
// Collisions (two screens of the same kind sharing an entity — the IR doesn't forbid it) are
// disambiguated by appending the screen's own name slug, so paths stay unique. Deterministic:
// screens are walked in IR order, so the same IR always yields the same paths.
export function screenPath(screens: ScreenModel[], target: ScreenModel): string {
  const used = new Set<string>();
  let resolved: string | undefined;
  for (const s of screens) {
    const base = `/${kebab(s.entity)}`;
    let path = s.type === "detail" ? `${base}/:id` : base;
    if (used.has(path)) {
      const disambiguated = `${base}-${kebab(s.name)}`;
      path = s.type === "detail" ? `${disambiguated}/:id` : disambiguated;
    }
    used.add(path);
    if (s === target) resolved = path;
  }
  // Fallback for a target not present in `screens` (e.g. a generator called in isolation
  // without the full sibling-screen list) — its own unsuffixed path.
  return resolved ?? (target.type === "detail" ? `/${kebab(target.entity)}/:id` : `/${kebab(target.entity)}`);
}
