# AGENTS.md — operating instructions for AI agents working in this repo

This file is the authoritative operating contract for any AI agent (opencode,
Claude Code, subagents) working in this repository. Read it first. It binds
over tool-only guesses; when in doubt, prefer the explicit rules here.

## Repository shape

- `lib/` + `test/` — **payment pilot** Flutter app (Rasheed). Working, do not
  regress. Follow existing feature-first layout and the dispatch pattern.
- `builder/` — **Flutter App Builder**: a deterministic compiler that turns
  `requirements → IR → idiomatic Flutter`. This is the active work area.
- `design/flutter-app-builder/` — design source of truth:
  - `DESIGN.md` (v3.5) — the authoritative design. Cite section numbers when
    you reference a rule (e.g. §9.4 oracle, §19 rule language).
  - `PHASE_PLAN.md`, `HANDOFF.md`, `GRILLING.md`, `BENCHMARK.md` — phase/state docs.
- Node package: `fahs-specs` (root `package.json`). Flutter package: `fahs`.

## Non-negotiables (hard rules)

1. **Never delete anything.** Changes are additive. If something must go, ask
   first. "Fix" means extend, not remove.
2. **Small commits only.** One logical slice per commit. Commit only when the
   user asks, or when the user's workflow requires it ("always do small
   commits"). Never commit secrets.
3. **Deterministic core is 0% LLM.** Generators are pure `(IR, ctx) → string`;
   only `builder/src/index.ts` does I/O. The LLM never writes code — it produces
   schema-validated `IR`/`RuleModel` (semantic lane) that is BLOCKED until human
   approval.
4. **Correctness needs an independent oracle.** A business rule with no
   (or zero-case) `<rule>.oracle.json` fails validation (blocking gate in
   `builder/src/validate.ts`). Never bypass it.
5. **Trust boundary**: LLM agent output is stamped `origin=llm-inferred,
   requiresApproval=true` and generation refuses until `builder/src/approve.ts`
   attests `actor=human:attested`. Don't weaken this.
6. **Generated code is owned by the compiler.** Header comment
   `// [generated] generator=… ownership=generated`. User regions are preserved
   by content-hash (`regions.json`) — never silent-overwrite.
7. **SOLID applies to all new code** (see the briefs pattern): one module =
   one concern; generators emit strings (no I/O); the oracle module only reads
   the corpus; the composition root (`index.ts`) wires; depend on types, not I/O.
8. **Lean handoff every round.** At the end of each round (or when the user asks),
   overwrite `design/flutter-app-builder/HANDOFF.md` with a lean, current-state
   summary (objective, actors, repo map, ground truth table, commits, in-flight
   work, verification commands, next steps, rules). **Move the previous HANDOFF
   content to `design/flutter-app-builder/context_history.md`** (append, dated
   header) so HANDOFF stays lean and history is preserved.
9. **Send goldens + progress to Telegram each run.** After generating/updating
   screens, capture iPhone-size goldens (golden tests already set `390×844`) via
   `flutter test --update-goldens`, then send the `.png`s + a one-line progress
   note to the owner over Telegram (mac_companion bot). Send photos with:
   `curl -s -F "chat_id=1117739189" -F "photo=@<file.png>" "https://api.telegram.org/bot$(cat ~/.mac_companion/token)/sendPhoto"`
   and text with `sendMessage` (`text=` field). Goldens MUST render real text —
   the golden test loads Roboto via `FontLoader` + `buildTheme()` (never bare
   `MaterialApp`, which renders Ahem boxes). **Break long content into multiple
   `sendMessage` calls** (one point/paragraph per message) — never one huge
   message; the owner reads on a phone.
10. **Always inform the owner on Telegram.** Every status change, each commit,
    each golden/photo, each bug/RCA, each slice start/finish goes to Telegram.
    If you're about to act, the owner should already know. When in doubt, send
    the message.
11. **All code you write is saved under the project folder.** No throwaway work
    in `/tmp` or the working tree without a copy in the repo. Anything worth
    writing is worth keeping. This includes temp harnesses, RCA docs, scratch
    generators, analysis scripts. Save them under the relevant `apps/<app>/`,
    `docs/qa/`, or `design/flutter-app-builder/` (additive — never delete).
12. **Maintain a code catalogue.** `design/flutter-app-builder/CODE_CATALOGUE.md`
    lists every artifact written this session/round: path, what it is, why it
    exists, status. Update it whenever you add or change code. It's the "what
    and why" index the owner asked for.
13. **Expose apps over Tailscale + send iPhone URL to Telegram.** When the owner
    asks to expose a generated app (or after any app milestone), serve it on the
    tailnet ONLY (never Funnel/public) and Telegram the iPhone URL. Recipe (full
    guide: `/Users/username/Documents/cto/mall_directory/docs/TAILSCALE_EXPOSE.md`):
    - Tailnet node: `macbook-air-m4-1`, IPv4 `100.94.138.3`; MagicDNS host
      `macbook-air-m4-1.taild16060.ts.net`; owner account `abdulrhman.shaheen@`
      (already the account on the iPhone, `iphone-14`).
    - `tailscale status` / `tailscale ip -4` to confirm up.
    - If the app lacks `web/`: `flutter create . --platforms web` (additive).
    - Build with a path prefix if another app owns `/`: `flutter build web
      --base-href=/<app>/`, serve `build/web` on a free loopback port with SPA
      fallback (e.g. the node server pattern; debug `flutter run -d web-server`
      works too but is slow through the proxy).
    - Mount via Serve WITHOUT clobbering existing mounts: `tailscale serve --bg
      --https=443 --set-path=/<app> http://127.0.0.1:<port>` (existing `/` and
      `/api` are the mall app — never reset them).
    - Verify with GET (HEAD 404s on flutter web-server): `curl -sk
      https://macbook-air-m4-1.taild16060.ts.net/<app>/` → 200.
    - Telegram: send the iPhone URL exactly as
      `IPHONE_URL=https://macbook-air-m4-1.taild16060.ts.net/<app>/` (+ tailscale
      IP + how-to-open), and re-send it on every subsequent expose of that app.

## Commands (run from repo root unless noted)

```bash
npm run typecheck:builder            # strict tsc on builder/ (run after every change)
npx ts-node --transpile-only builder/src/index.ts <ir> <out>   # generate an app
npm run validate:gen                 # determinism + headers + secrets + idioms + arch + oracle
npm run pipeline                     # generate→pub get→analyze→test→build web→validators
npm run server                       # HTTP API on :8787 (POST /generate, /requirements, /generate/full)
npx ts-node --transpile-only builder/src/validate.ts <ir> <out> # run AFTER generating <out>
npx ts-node --transpile-only builder/src/approve.ts <ir-file>   # human attestation gate
npx ts-node --transpile-only builder/src/benchmark.ts            # semantic parity
npx ts-node --transpile-only builder/src/regen.ts <ir> entity:X  # affected-set
npx ts-node --transpile-only builder/src/extract.ts <dart> Name  # reverse extraction
```

Sample IRs: `builder/samples/{expense.ir.json, expense.semantic.ir.json,
inventory.ir.json, todo.ir.json, rasheed.ir.json, promo.ir.json}`.
Oracle corpus: `builder/samples/rules/<rule>.oracle.json`.

## Per-app artifact convention (`apps/<app>/`)

Every generated app keeps ALL its artifacts in one app folder — input on one side, output on the
other. Future audits and enhancements must follow this layout; never scatter an app's files across
`builder/samples/`, `/tmp/`, and `docs/qa/`.

```
apps/<app>/
  input/                     # everything the generator consumes
    <app>.ir.json            # the IR
    rules/<rule>.oracle.json # oracles live in input/rules/ (oracleDirFor = dirname(ir)+/rules)
    brief.md                 # (optional) NL brief / spec the IR was derived from
    notes.md                 # (optional) decisions, sample-specific context
  output/                    # everything the generator produced + verification evidence
    app/                     # the generated Flutter project (the <out> dir of index.ts)
    goldens/                 # copy of iPhone-size golden PNGs (from test/goldens)
    cdp/                     # CDP flow-driver screenshots + assertions (F3)
    rca/                     # root-cause analyses of any generator bug found via this app
    validation.txt           # output of validate.ts for this app
    README.md                # how to run, demo personas, feature map
```

- Generate from `apps/<app>/input/<app>.ir.json` into `apps/<app>/output/app/`.
- **Fix the generator, never the generated app** (`apps/<app>/output/app/` is disposable — always
  regenerate). Any bug found while exercising an app gets an RCA (under `apps/<app>/output/rca/`
  or `docs/qa/<app>/rca/`) and the fix lands in `builder/src`, then regenerate.
- Existing legacy samples stay in `builder/samples/` (do not move — additive-only); new apps go in
  `apps/<app>/`.

## Code graph (graphify)

`builder/src/` is graphed via the `graphify` skill into `graphify-out/` (`graph.json`,
`GRAPH_REPORT.md`, `graph.html`). Currently untracked (not yet in `.gitignore` or committed) —
ask before deciding which.

- **Read the graph, don't grep-explore, when:**
  - doing a SOLID/architecture review or audit (god nodes, communities, cross-module coupling).
  - answering "where is X / what calls Y / how does Z flow" across `builder/src` — prefer
    `graphify query "<question>"` over multiple manual `grep`/`Explore` passes once
    `graphify-out/graph.json` exists; it's the fast path (see the skill's own "Fast path —
    existing graph" rule: don't rebuild just to answer a question).
  - verifying a suspected dead-code / unused-field / false-abstraction claim (e.g. "is this
    struct field ever consumed downstream?") — cross-check graph edges against a direct code
    read; the graph is function/module-level, not field-level, so use it to confirm breadth of
    coupling, not as the sole source for field-level claims.
  - onboarding to an unfamiliar corner of `builder/src`.
- **Update/rebuild the graph when:**
  - `builder/src` has had structural changes since the last build — new generator files, new
    registry entries, renamed/removed modules — i.e. whenever a review or handoff needs the
    graph to reflect current code, not a stale snapshot. Use `/graphify builder/src --update`
    (incremental) rather than a full rebuild when only a few files changed.
  - `GRAPH_REPORT.md`'s header date predates recent commits touching `builder/src`.
- **How to use it:**
  - `graphify query "<question>"` — BFS traversal for broad context (add `--dfs` to trace one
    specific path, `--budget N` to cap output).
  - `graphify path "<A>" "<B>"` — shortest path between two named symbols/concepts.
  - `graphify explain "<Node>"` — plain-language explanation of one node.
  - Cite `source_location`/file:line from graph output the same way you'd cite a `grep` hit —
    it's an index into the real code, not a replacement for reading the code it points to.

## LLM agent work (semantic lane)

- Default model for agent LLM calls is **`opencode/deepseek-v4-pro`** (see
  `MODEL` in `builder/src/requirements.ts` and `builder/src/business_rule_agent.ts`).
- `builder/src/requirements.ts` — RequirementAgent: NL → structural IR.
- `builder/src/business_rule_agent.ts` — BusinessRuleAgent: NL business rules →
  `RuleModel[]` in the closed rule language (§19). Deterministic shell:
  parse → schema-validate → cross-check entity/field references → stamp
  provenance → split unexpressible rules into `extensionQueue` (§19.4).
  Live path is a thin wrapper; verification uses `--fixture`.
- After producing IR with LLM-inferred elements: run `approve.ts`, then
  generate, then validate. A rule without an oracle stays blocked.

## Verification workflow (required before reporting done)

1. `npm run typecheck:builder`
2. For each affected sample: generate then validate
   (`index.ts` then `validate.ts` on the same outDir).
3. For a sample app: `flutter pub get && flutter analyze && flutter test`
   in the generated outDir (goldens: `flutter test --update-goldens` first).
4. Report exact command output; the orchestrator reviews and commits.

## References

- Architecture/design: `design/flutter-app-builder/DESIGN.md`
- Grilling (scope/planning): `design/flutter-app-builder/GRILLING.md`
- Roadmap phases: `DESIGN.md §25` — v1 = end of Phase 3 (semantic lane + trust boundary).
