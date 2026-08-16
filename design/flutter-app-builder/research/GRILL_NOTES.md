# Grill notes — my self-review of the 3 spike reports (before claude review)

Date: 2026-08-16. I challenged each spike against the actual codebase before sending to claude.

## COMPETITIVE_BENCHMARK.md — validated, 3 pushes
- G1-G6 gap table is honest and the strongest single insight is **G4 (visual quality)** — "no
  technical strength compensates for a screenshot that doesn't look designer-made" → P11 D2-D4 is
  correctly prioritized. Agreed.
- **Push G3 (live preview)**: the report says competitors beat us with instant preview; our
  CFT/CDP flow is a *verification* gate, not a user-facing preview. For OUR product (a generator
  for teams), preview matters less than for consumer no-code tools — demote G3, keep G4/G5 (deploy)
  as the moat work. Don't chase WebContainer-style in-browser preview prematurely.
- **Push G5 (deploy)**: Tailscale-expose is intentionally private; a one-click public deploy is a
  product decision, not a technical gap. Keep it a roadmap option, not an implied requirement.
- **Steal-list (§7.1)** is the actionable part — I'll ask claude to fold the top 3 steals into the
  roadmap with effort/impact.

## BACKEND_GEN_OPTS.md — validated (NestJS stays P9), 2 pushes
- The verdict (NestJS default; Fastify=transport not competitor; tRPC loses value TS→Dart; BaaS is
  a separate `persistence.backend: baas` lane) is correct and matches our arch. Agreed.
- **Push R1**: "module/entity/controller/DTO as decorator-metadata" must map to our EXISTING
  MF1 `features[]` multi-feature IR, NOT a new module shape — one IR, one module-per-feature.
- **Push R6**: the backend must stay OPTIONAL (offline-first default) and the Flutter repo switch
  in-memory↔HTTP must be behind ONE interface (already our pattern) — the report agrees, but make
  it an explicit P9 acceptance line.

## AUTH_OPTS.md — validated (Supabase-first adapter), 2 pushes
- Supabase-first (RLS mirrors the generated `tenantId` model; anon key safe client-side) is the
  right first real adapter. Agreed.
- **Push §5's "future, no code today"**: our MF2 already emits the mock `AuthPort` + Session +
  persona login. The generator should NOW expose a `AuthPort` interface (Session behind it) so
  Supabase is a drop-in adapter later — the report's sequencing under-credits what MF2 shipped.
- **Push §6 Clerk-fourth**: Clerk's demo velocity matters for the owner's "show on iPhone fast"
  loop; keep it a documented swap, not ranked last by fit alone.

## Next
Send all 3 reports + these grills to claude for its independent review + adversarial grill; fold
its output + these notes into ROADMAP.md (P9/P11/P12/MF2 evolution) and LEFTOVER_NOTES.md.
