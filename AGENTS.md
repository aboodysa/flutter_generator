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
5. **Spikes are research, not implementation.** A spike investigates a hypothesis and must end
   in a decision (`ADOPT`/`MODIFY`/`REJECT`/`DEFER`/`SPLIT`/`ESCALATE`) with recorded evidence —
   it must never assume the proposed solution is correct. The full operating protocol is in
   `design/flutter-app-builder/research/SPIKE_PROTOCOL.md` (binding: read it before starting any
   spike; read-only-by-default, no commits during research, investigate → prove → decide →
   implement-last). Every spike produces its required report (§17) under
   `apps/<app>/output/qa/` or `design/flutter-app-builder/research/`.
6. **Trust boundary**: LLM agent output is stamped `origin=llm-inferred,
   requiresApproval=true` and generation refuses until `builder/src/approve.ts`
   attests `actor=human:attested`. Don't weaken this.
7. **Generated code is owned by the compiler.** Header comment
   `// [generated] generator=… ownership=generated`. User regions are preserved
   by content-hash (`regions.json`) — never silent-overwrite.
8. **SOLID applies to all new code** (see the briefs pattern): one module =
   one concern; generators emit strings (no I/O); the oracle module only reads
   the corpus; the composition root (`index.ts`) wires; depend on types, not I/O.
9. **Lean handoff every round.** At the end of each round (or when the user asks),
   overwrite `design/flutter-app-builder/HANDOFF.md` with a lean, current-state
   summary (objective, actors, repo map, ground truth table, commits, in-flight
   work, verification commands, next steps, rules). **Move the previous HANDOFF
   content to `design/flutter-app-builder/context_history.md`** (append, dated
   header) so HANDOFF stays lean and history is preserved.
10. **Send goldens + progress to Telegram each run.** After generating/updating
   screens, capture iPhone-size goldens (golden tests already set `390×844`) via
   `flutter test --update-goldens`, then send the `.png`s + a one-line progress
   note to the owner over Telegram (mac_companion bot). Send photos with:
   `curl -s -F "chat_id=1117739189" -F "photo=@<file.png>" "https://api.telegram.org/bot$(cat ~/.mac_companion/token)/sendPhoto"`
   and text with `sendMessage` (`text=` field). Goldens MUST render real text —
   the golden test loads Roboto via `FontLoader` + `buildTheme()` (never bare
   `MaterialApp`, which renders Ahem boxes). **Break long content into multiple
   `sendMessage` calls** (one point/paragraph per message) — never one huge
   message; the owner reads on a phone. **When the owner asks for a file
   (report/markdown), send it as an ATTACHMENT via `sendDocument`
   (`curl -F "document=@<file>" .../sendDocument`), not as text chunks** —
   attachments are the preferred form for files; chunked text is for progress
   notes only.
11. **Always inform the owner on Telegram.** Every status change, each commit,
    each golden/photo, each bug/RCA, each slice start/finish goes to Telegram.
    If you're about to act, the owner should already know. When in doubt, send
    the message.
12. **All code you write is saved under the project folder.** No throwaway work
    in `/tmp` or the working tree without a copy in the repo. Anything worth
    writing is worth keeping. This includes temp harnesses, RCA docs, scratch
    generators, analysis scripts. Save them under the relevant `apps/<app>/`,
    `docs/qa/`, or `design/flutter-app-builder/` (additive — never delete).
13. **Maintain a code catalogue.** `design/flutter-app-builder/CODE_CATALOGUE.md`
    lists every artifact written this session/round: path, what it is, why it
    exists, status. Update it whenever you add or change code. It's the "what
    and why" index the owner asked for.
14. **Expose apps over Tailscale + send iPhone URL to Telegram.** When the owner
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
15. **Developing a CDP driver fast (mall-session pattern).** When the owner says
    "drive/test the app", reuse the existing infra instead of writing a browser
    from scratch:
    - Infra: CFT headless on `:9222` (`/Users/username/temp/opencode/cft/chrome-*
      *`), shared `CdpSession` at `/Users/username/Documents/cto/new_chrome_ext/
      tools/cdp_driver.py` (boot, `activate_semantics`, `ax()`, `click_node`,
      `click_button`, `screenshot`, `drain_errors`), lessons in `new_chrome_ext/
      tools/FLUTTER_TESTING_LESSONS.md` and overflow scanner in `tools/overflow/
      overflow_scan.py`.
    - New tab: `PUT http://127.0.0.1:9222/json/new?<url>`; close via
      `/json/close/<id>`. Flutter semantics need activation (1×1 placeholder —
      click it via DOM, not coordinates). Verify with GET, not HEAD.
    - Probe checklist for a generated app: boot → semantics → full AX tree (roles/
      labels → a11y) → console+network errors → exercise every route (tap list
      card → detail, edit icon → form, parent→child link) → input kinds (date/
      enum dropdowns) → tap-to-focus + typing (keyboard) → overflow scan across
      320/390/768/1280 → screenshots at each step into `apps/<app>/output/qa/`.
    - Findings go to `apps/<app>/output/qa/PROBE_FINDINGS.md` (G1/G2 style:
      symptom, root cause, location, severity) + Telegram. Fixes land in the
      generator (never the generated app), then regenerate + rebuild web + re-probe.
    - **CDP is the REQUIRED verification gate for UI-affecting slices** (l10n/RTL,
      navigation, forms, a11y): after `flutter analyze/test` green, build web +
      serve, drive via the shared driver, capture AX + screenshots. RTL: set the
      AR locale and check Directionality flip + no overflow. Write findings under
      `apps/<app>/output/qa/` (folder per slice: `qa/l4-rtl/` etc.) — symptom,
      enhancement needed, severity. Reusable harnesses: `apps/tasks/output/qa/
      gen_all_flows_harness.py` + `capture_all_flows.sh` (all-flows goldens, one
      screen per invocation to avoid router-state contamination) and
      `app_walkthrough.py` (per-app AX/field-visibility).

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

## IR input guidelines (prevent mistakes at generation time)

When writing/editing `*.ir.json` inputs, apply these so the generated app is honest and
minimal — a field/screen/rule you add here becomes real code, goldens, forms, and tests:

- **Every field must be *consumed* somewhere the user can see or act on.** Before adding a field,
  ask: is it displayed (list/detail/form), filterable, sortable, or rule-scoped? If none, drop it
  or say why it's needed. A `createdAt`/`updatedAt`/`createdBy` timestamp is only justified when
  the app actually orders by it, shows it, or needs an audit trail (Ledgerly L3) — not "every row
  gets one" out of habit. Owner's rule: timestamps are an explicit L3 capability, never an
  implicit default. (Lesson: tasks sample got a speculative `FollowUp.createdAt` — reverted, then
  restored because the owner DOES want to see it; both are valid, the point is *decide consciously*.)
- **Identity fields** are `id` (String by default). Do not name a FK "id" — child links use
  `<Parent>Id` (`FollowUp.taskId`), which drives parent→children navigation.
- **Money** (`semanticType: "Money"`, `currency: "SAR"` etc.): never a raw `double` for money. A
  money field without a currency is a defect (validator `[money]` catches the double form only).
- **Enum fields** declare `"of": "<EnumType>"` and a `default` when the status has a resting state
  (e.g. `status` starts `open`/`submitted`). Rules over enum fields need an oracle (`rules/` dir
  next to the IR) or validation fails.
- **One primary display field** per entity named `title`/`name`/`merchant`/`label`/`subject` — the
  demo rows and list cards read human ("Sample Task 1") off it; without it the demo is `'x'`-junk.
- **Screens**: a list screen needs a repo with `list`; detail screens need `:id` param support;
  a wizard step references fields that exist on the entity. Declare `states` for every screen.
- **Repositories**: create/update/delete only when the UI actually edits; a repo without
  create/update yields no CRUD form (no "New"/edit/delete affordances).
- **Business rules** always ship a `<rule>.oracle.json` with ≥1 case (validator `[oracle]` gate).
- **Nullable vs required** mirrors the UI: nullable fields render `—` when empty; required fields
  cannot be left blank in the generated form.
- After editing an IR: regenerate the app, run `validate.ts`, and `flutter analyze/test` — the
  IR is the single source of truth; validation is the gate.
- **Regeneration drops `web/` (G5).** `index.ts` only emits `lib/`+`test/`+`pubspec`; re-generating
  `apps/<app>/output/app` deletes any `web/` platform (and goldens are regenerated). After every
  regenerate that must be served on the tailnet: `flutter create . --platforms web
  --project-name rasheed_replica_<app>` then `flutter build web --base-href=/<app>/`. Same for
  `.metadata`/`analysis_options` if `flutter analyze` starts complaining. (Deeper fix — emit a
  `web/` in the generator — is an open generator task; until then this is the documented step.)

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

## Model tier — implementer separation (owner directive 2026-08-17)

A "**zen**" model (cheap/fast — e.g. `opencode/deepseek-v4-flash` and any similarly cheap local
tier) is an ORCHESTRATOR ONLY. It never writes code into the tree:

- **A zen model does not implement.** It plans, scopes, verifies (read-only commands), reviews
  diffs, writes decision/spike/research docs, and drives the implementer — but it does not edit
  `builder/src/**`, generated apps, or any implementation file.
- **Implementation is done by Claude first, remote service as fallback.** The implementer for a
  code edit is **Claude (Claude Code)** — the preferred executor. If/only when Claude hits quota
  (rate/reset wall), fall back to the **remote opencode agents** on the owner's VPS hosts
  (tracematrix / tracematrix001, see below) via tmux. Workflow either way: write a brief, send it
  to the implementer, let it edit + commit, then the zen model reviews the returned diff and
  verifies. Capture which implementer ran + that it committed (report to the owner on Telegram).
- **Use a "pro" / non-zen model for anything that must write code locally** (e.g.
  `opencode/deepseek-v4-pro`) only as a last resort — never let the zen model do both orchestration
  and implementation.
- **Spikes run on remote opencode agents, NOT Claude.** Read-only spike research
  (SPIKE_PROTOCOL: read → ground → hypothesize → investigate → prove → decide → report) is the
  remote opencode channels' job on the owner's VPS hosts (tracematrix/tracematrix001) — Claude Code
  is NOT used for spikes. A zen model drives the remote channels, but does not itself do the spike
  investigation/implementation. The zen model reviews the returned spike report + decision.
  (Exception: trivial / already-in-context checks a zen model answers from source already read this
  session.)
- This keeps cheap-model loops token-light and correct: the zen model's high-value work is
  cross-checking, not keystrokes. If the current session's model is zen and a task needs a code
  edit, the default move is: capture a brief → Claude first → if Claude hits quota, send to a
  remote opencode channel → review + verify.

## LLM agent work (semantic lane)

- **Spike protocol binds all agents.** Before any spike (in this repo or on remote hosts), read
  `design/flutter-app-builder/research/SPIKE_PROTOCOL.md` — it is the non-negotiable execution
  rules: spikes are research producing an `ADOPT`/`MODIFY`/`REJECT`/`DEFER`/`SPLIT`/`ESCALATE`
  decision; read-only-by-default, no commits during research, investigate → prove → decide →
  implement-last. Spike reports (§17 of the protocol) land under `apps/<app>/output/qa/` or
  `design/flutter-app-builder/research/`.
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

## RCA standard (mandatory for every bug/surprise)

Every problem found while exercising an app or generator gets an RCA document, always with ALL of:
1. **Symptom** — what the user/owner actually saw (verbatim where possible).
2. **Investigation** — what was tried to reproduce, evidence (browser/CDP, widget tests, source).
3. **Root cause** — the real mechanism, not the first hypothesis (e.g. "iOS Safari only opens the
   keyboard when `.focus()` fires synchronously inside the tap; the lazy DOM-proxy creation pushes
   it outside the gesture window").
4. **Fix / solution** — the exact generator change (file + why). If investigated and NOT a code
   defect, say so explicitly and still deliver a forward-looking regression test.
5. **Logic / rationale** — WHY the fix is correct (the mechanism that makes it work), and what
   alternatives were considered and rejected (and why — "would mask the real cause").
6. **Verification** — exact commands + outputs (incl. stash-based before/after when the fix is a
   generator change: test fails on pre-fix generator, passes after).
7. **Prevention** — the guard that stops it recurring (validator gate, post-generation regression
   test, IR-input guideline).

RCA files: `apps/<app>/output/rca/RCA-NNN-<slug>.md` (or `docs/qa/<app>/rca/`). Numbered
sequentially (RCA-001…). "Fix" never lands in the generated app — always in `builder/src`, then
regenerate. When a slice ends with an investigated-but-unfixed item, it stays open in
`LEFTOVER_NOTES.md` with the recommended next step.

## Verification workflow (required before reporting done)

1. `npm run typecheck:builder`
2. For each affected sample: generate then validate
   (`index.ts` then `validate.ts` on the same outDir).
3. For a sample app: `flutter pub get && flutter analyze && flutter test`
   in the generated outDir (goldens: `flutter test --update-goldens` first).
4. Report exact command output; the orchestrator reviews and commits.

## Remote opencode hosts (owner's infrastructure — tracematrix / tracematrix001)

Drive opencode over SSH on the owner's VPS hosts; use a tmux channel per host so work survives
disconnect and the owner can watch. Never run heavy agent loops in the foreground of an ad-hoc
SSH command — always attach a tmux session first.

### Hosts (SSH keys in `~/.ssh/`, root login)

| Host short | SSH target | Box | opencode | Current tmux channels |
|---|---|---|---|---|
| **tracematrix** | `ssh root@tracematrix.businessanalystcrew.org` | n8n1671onubuntu2204lts (nyc1, 1vcpu/1gb) | `/usr/local/bin/opencode` (v1.17.15) | `germany` (bash, `/visa_search`), `germany3` (opencode, `/flutter_generator`) |
| **tracematrix001** | `ssh root@tracematrix001.businessanalystcrew.org` | ubuntu-4gb-fsn1-3 (fsn1) | `/root/.opencode/bin/opencode` | `bp-claude`, `bp-watch`, `ooo` (browserpilot workflow) |

### How to work on a remote host (opencode pattern)

```bash
# 1. Connect + attach the channel (or create one for a new topic)
ssh root@tracematrix.businessanalystcrew.org
tmux attach -t germany3            # existing opencode channel on /flutter_generator
# or start fresh:
tmux new -s <topic>                 # then cd <workdir> && opencode

# 2. Reattach from the orchestrator side without full TUI (non-interactive control)
tmux send-keys -t germany3 'your opencode prompt' Enter
tmux capture-pane -t germany3 -p | tail -30   # read output
```

- **Persist across disconnect:** tmux keeps the opencode process alive; reopen with
  `ssh root@…` then `tmux attach -t <topic>`.
- The `germany3` channel currently runs opencode with cwd `/flutter_generator` on tracematrix —
  match or reuse it for flutter-generator-adjacent work on that host.
- `tracematrix001` `bp-claude` is a browserpilot/overseer notify channel; use `bp-watch`/`ooo`
  for watcher-style work; confirm the session's active topic before sending anything.

### Rules for remote agent work

- **Zen-model delegation is the default (see "Model tier — implementer separation" above):** this
  local session's model is usually zen, so implementation (Claude first; remote opencode channel as
  fallback on quota) and spike research (remote opencode channel) are captured into briefs and
  handed to the implementer, then reviewed + verified here. The remote agent is the implementer;
  the local zen session is the orchestrator.
- Same discipline as local: read that host's `AGENTS.md`/`CLAUDE.md` first if present; small
  commits; never delete; report to the owner on Telegram.
- Remote VPS boxes are small (1vcpu/1gb on tracematrix) — avoid heavy builds (Flutter/web)
  there; reserve those for the Mac. Prefer the remote for lightweight opencode/agent runs,
  file/analysis tasks, and scripts.
- Always confirm a remote tmux channel is idle (prompt `❯` visible, no spinner) before typing
  into it — never paste over a running turn.
- If a remote session shows the plan/quota dialog, treat it like the local one: pick the
  non-paying option ("stop and wait") and park the prompt until reset; never upgrade.

## Context / token discipline (owner directive 2026-08-17 — keep loops cheap)

Every long-running agent loop (local claude/opencode channels AND remote tmux channels) must
manage its context so work never dies to an uncached-token wall and tokens stay cheap.

1. **Compact when the conversation grows.** Claude Code: send `\`/compact`` (or type `/compact`)
   when tokens climb (e.g. claude shows `~NNNk uncached · /clear to start fresh`, or a turn is
   deep into a many-command investigation). `/compact` condenses history, preserves the task, and
   the channel keeps working. Prefer it over waiting for the quota/reset screen.
2. **Start a fresh session when history has no value.** When a slice/topic is done and the next
   task is independent (e.g. a finished P1 → P2), do NOT keep wallowing in the old context:
   - Claude Code: `/clear` (or `/clean`) then re-issue the task with a pointer to the brief +
     contract; prior state lives on disk (commits, HANDOFF.md, CODE_CATALOGUE.md, briefs under
     `research/`) so nothing is lost.
   - opencode: exit (`Ctrl+C`) then relaunch `opencode` in the same tmux channel for a new session;
     or `/new` if available.
   - Rule of thumb: **/clear or new session when history no longer helps the next slice; /compact
     when you're mid-slice and just need headroom.** Never pay to re-read full history.
3. **Re-anchor after losing context.** After `/clear`/new session, point the agent at the
   authoritative docs first: this AGENTS.md, `design/flutter-app-builder/HANDOFF.md`,
   `CODE_CATALOGUE.md`, and the relevant `research/*_IMPLEMENTATION_BRIEF.md` + contract — then
   the task. Commit first, so the fresh session starts from a clean tree.
4. **Remote channels: kill and fresh, never prolong.** Remote tmux opencode channels are the
   cheapest place to lose tokens — and they have no cost-free reset quota. Do NOT `tmux attach`
   and keep typing into a long-lived session. Instead:
   - Before starting a new task on tracematrix/tracematrix001, **kill the old opencode process and
     tmux session and create a brand-new session/channel** (e.g. `tmux kill-session -t germany3`
     then `tmux new -s germany3` and relaunch `opencode`). Same for any remote channel (`germany`,
     `bp-claude`, `bp-watch`, `ooo`). A stale channel carries polluted context + a giant backlog;
     a fresh one starts near-empty and cheap.
   - Exceptions: a mid-slice task that is genuinely still running (don't kill active work); in that
     case `/compact` first, finish, then kill and fresh for the next task.
   - Never let a remote session sit for hours between tasks — if it's idle with an old prompt
     backlog, kill it now rather than "saving" it.
5. **MCP servers add context weight — disable what a task doesn't need.** MCP tool results stay in
   context for the whole session and add up fast (e.g. claude-in-chrome alone measured ~21% of
   usage). Per-slice rule: enable only the MCP servers the current slice actually calls
   (browser/CDP only for UI slices; Penpot only for design; etc.). Disable the rest for the run.
6. **Graphify-queries instead of grep slices.** When the question spans `builder/src` structure
   ("where is X", "what calls Y", "how does Z flow"), or on onboarding, prefer
   `graphify query/path/explain` over multiple manual `grep`/`Explore` passes (see the Code graph
   section). One BFS traversal answer replaces dozens of greps and re-reads. Update the graph with
   `/graphify builder/src --update` only when structure changed; never rebuild just to answer.
7. **Watch the measured drivers.** Real usage signal from June 2026 audit: ~95% of usage came from
   sessions >150k context; ~92% from sessions active 8+ hours. Both are symptoms of "one giant
   session per project" — the fix is rules 1–4, not designing around the quota. If you see a
   claude context meter in the hundreds of k on a loop channel, `/compact` immediately, then plan
   a `/clear` at the next slice boundary.
8. **Keep a task alive on disk, not in context.** Before `/clear`/kill/new on any channel, make
   sure the current state is durable in the repo: commit the slice, then note in HANDOFF.md /
   CODE_CATALOGUE.md what the next agent should re-anchor on. The disk is the memory; the session
   should be disposable.

## Mermaid diagrams in decision docs (owner workflow, 2026-08-17)

Owner asks for **pipeline + sequence diagrams as mermaid** in decision docs (e.g. `SCTX_DECISION.md`),
with **areas of interest highlighted** — the parts the document actually decides on get a distinct
shade/fill (e.g. `style NODE fill:#fff3cd,stroke:#b8860b` amber for "the new gate/slice", a light
blue `#e8f0fe` for "decision-as-data" nodes, a dashed `#f3f6f9` for gate/validate groupings).

Workflow (mmdc installed globally; needs a puppeteer chrome):
- Write the `.mmd` source under `design/flutter-app-builder/research/mermaid/` (keep sources in
  the repo — rule 12; the PDF depends on re-rendering them).
- Render with the CFT chrome bundle (mac): `mmdc -p
  design/flutter-app-builder/research/mermaid/puppeteer-config.json -i <in>.mmd -o <out>.png
  -b white -s 2` — the config pins puppeteer to `chrome-mac-arm64/Google Chrome for Testing`
  (installed headless-shell is absent; plain `mmdc` fails with "Could not find chrome-headless-shell").
- Embed the PNGs in the PDF build (Chrome `--headless --print-to-pdf`) — markdown can't render
  mermaid code, so always produce the PNG for the PDF version.
- Deliver both **MD + PDF** to the owner on Telegram as `sendDocument` attachments, never text
  chunks (rule 10). Send MD and PDF as separate documents.

## Guiding principles — probed-app / generated-app verification (2026-08-19, round lessons)

Hard-won rules from the benchmark + kids_quiz round. Full writeup: `research/LESSONS_LEARNED_ROUND_2026-08-19.md`.

1. **A new app must deliberately re-drive every declared-but-under-exercised generator path.** Latent
   defects (nosql hive-adapter broken import; `fieldRole()` chip-only-for-status/priority/decision) were
   found ONLY because kids_quiz hit code paths none of the 6 benchmarked apps exercised. Benchmark-before-
   build; pick the reference app's archetype from the benchmark report, then probe the corners.
2. **Flutter web deep-links don't route on fresh-tab boot** — go_router rewrites to `initialLocation`
   (`#/question`). To drive a specific screen via CDP, use `window.location.hash = '#/route'` in the
   running app (Runtime.evaluate), then re-settle.
3. **Route-only reachability is a UX gap, not just a routing fact.** A wizard/quiz behind a route with no
   in-app entry point (sections home's floating "Add to cart" FAB is decorative) is unreachable from the
   phone UI. When a flow is the product's core action (a quiz run), wire a real entry from home — don't rely
   on deep links.
4. **Plain enum fields render as DropdownButton, and the AX view shows raw enum VALUE keys
   (`menuitem:a/b/c/d`)**, not human labels — hostile to a11y and to tests. The generated a11y test only
   checks the wizard's first step, so step 2+ is blind. Prefer choice-chips for multiple-choice UX (IR-level
   `role:"choice"` hint or value-shape heuristic is the recommended v1.1 fix); make a11y tests walk every
   step.
5. **CDP probe mechanics** (pin from the round): `ax()` returns `list[dict]` (no `.to_csv`); `/json/new`
   needs **PUT**; `/json/close` 404s on already-closed tabs (wrap in try/except); after dropdown pick + Next
   the AX tree can go empty during a step transition — poll until non-empty before declaring a route dead;
   verify routes with GET, never HEAD.
6. **Orchestrator re-verifies every implementer claim**: `npm run typecheck:builder`, `validate.ts` (all
   gates), `flutter analyze` (0 errors), `flutter test`, PLUS an independent double-regen determinism check
   (`diff -r` two fresh regens). Report exact output; only then report done.
7. **Regen drops `web/` (G5) — recreate + rebuild after every generate** (`flutter create . --platforms web
   --project-name rasheed_replica_<app>`, `flutter build web --base-href=/<app>/`), serve `build/web` on a
   loopback port with SPA fallback, mount additively with `tailscale serve --set-path=/<app>` (never
   clobber `/`, `/api`, `/tasks`, `/keemart`, `/hr_service`), verify GET 200.
8. **L4-style additive slices stay byte-identical for existing apps**: extend the closed enum with a new
   value (`locale: "enArFr"`), never touch existing branches; the determinism gate + regen diff guard it.
9. **Claude-lane**: usage dialog re-prompt mid-task → `Escape` returns the lane to its local `❯` prompt with
   state intact (verify with `git log`, not the pane); after `send-keys` a dispatch, press **`Enter`** to
   actually submit it — plain `send-keys` leaves it sitting un-submitted in the input box.

## References

- Architecture/design: `design/flutter-app-builder/DESIGN.md`
- Grilling (scope/planning): `design/flutter-app-builder/GRILLING.md`
- Roadmap phases: `DESIGN.md §25` — v1 = end of Phase 3 (semantic lane + trust boundary).
- Remote garden pattern (source of the host/tmux convention): owner request 2026-08-17 — drive
  opencode in tracematrix + tracematrix001 via `ssh root@…` + tmux channel.
