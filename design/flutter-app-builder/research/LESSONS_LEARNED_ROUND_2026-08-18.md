# Lessons learned — visual lane round (S1 + review + evidence + ops tooling)

**Date:** 2026-08-18 · **Scope:** S1 spike→impl→review→evidence→approval, review-loop discipline, same-screen showcase, token-reduction ops. Companion report map: `SPIKE_S1_REPORT.md`, `SPIKE_S6_REPORT.md` (in progress), `SPIKE_S2_SPIKE_BRIEF.md`, `S1_PROOF_SCREENS.html/.pdf`, `SPIKE_EXEC_SUMMARY.md`, `TOKEN_OPS_TOOLING_BRIEF_CLAUDE.md`.

## 1. Evidence must be *inspectable by an external reviewer*, not just "sent"
- The first PDF was rejected ("not verifiable / fail gate") purely on presentation: an LLM reviewer
  extracts text, not pixels. Three labeled PNGs inside a PDF are not reviewable evidence.
- Fix that worked: send the **3 goldens as standalone PNG attachments** (the reviewer's explicit
  ask) **plus** a PDF where the *claims* are text-verifiable: a token table, provenance chain,
  negative-control CLI output, and determinism hashes. "Rendered composition" = human proof;
  "resolved tokens + CI output" = machine proof. Ship both, never one.
- Story: S1 v1 = rejected (5/5 not verifiable) → v3 = approved 5/5 PASS after adding token tables +
  live CLI outputs. The delta was **presentation**, not behavior.

## 2. When a review asks "add to tests", it means permanent regression tests in the repo
- "after each add these to tests" → the 5 review items became `test/s1_visual_intent.test.ts`
  (20 tests, 63/63 suite green). Every future review now cites committed CI.
- Lesson: capture evidence → immediately pair every evidence artifact with the test that will keep
  it true. Evidence docs age; tests don't.

## 3. Same-screen, side-by-side beats different-screen samples
- The 3 proof screens (tasks/hr_service/ledgerly = 3 different apps) look "barely different" to the
  human eye: different content dwarfs the token delta.
- The convincing comparison is **the same screen (TaskListScreen) rendered with 3 configs** at the
  extremes of the token scales: `rounded` (12/16/24, spacing-md) vs `sharp/strong` (4/8/16, spacing-sm,
  hero-2x) vs `pill` (16/24/999, spacing-lg) — placed side-by-side in one contact sheet with a caption
  bar. Difference in card radius + rhythm becomes unmistakable.
- Rule: a token-diff review needs **one controlled variable** (only `visualStyle` changes).

## 4. Claude-Code orchestration gotchas (repeated every round)
- The **welcome overlay eats the first Enter** after `/clear` → prompt sits unsubmitted in the input
  box looking idle. Send `Escape` then `Enter` to dismiss before trusting "idle".
- `❯` prompt is always present even while Claude is "thinking" between tool calls — **do not** use
  `❯`-present as the idle signal. Idiom that worked: poll for content-change; a commit SHA change is
  the only hard signal. Batch jobs (Pouncing/Precipitating/… suffix "ing") = busy.
- Approval gates show as `? 1.` at the bottom; answer `1<Enter>` or the run hangs "idle".
- When Claude finishes a task it parks at `❯` with its full report **in the pane** — always read the
  last 20 lines before assuming the work is done (it often asks "say the word and I'll push").

## 5. Remote (tracematrix) spike-lane discipline
- A stale opencode channel carries polluted context (measured 73% on germany3 after S1). Kill-and-fresh
  per task (rule 4 of AGENTS.md context discipline), then `cd <workdir && opencode`, then prime with
  the brief path. Never paste a prompt into a session that has old conversation.
- `tmux send-keys` a long multi-line prompt in one shot — a follow-up `sleep; capture-pane` verifies
  the prompt was received (a prior bare `germany3` launch produced no output and the prompt never
  landed; the "dispatch" felt done but nothing ran).
- The remote agent's report lands in the working copy, not necessarily committed → `scp` it back and
  commit locally. Remote clones lag master; `git fetch && reset --hard origin/<branch>` first.

## 6. Determinism / hash evidence traps
- A naive "hash the output dir" differs between runs because `find | xargs shasum` order is unstable.
  Canonical folder hash: `cd dir && find . -type f | sort | xargs shasum -a 256 | shasum -a 256`.
- Always pair the hash with `diff -r A B` (the directly human-readable proof). Both same → bulletproof.
- A regression test is only credible if you prove it can fail: force a wrong expected value, see the
  suite go red, revert. (Claude did this and caught a bug in its own assertion along the way.)

## 7. Token-reduction ops tooling is being built for exactly these repeats
- The 6 helpers in `tools/orchestrator/` (`poll.sh`, `dispatch_kill_fresh.sh`, `tgsend.sh`,
  `pdf_build.sh`, `capture_golden.sh`, `genapp.sh`) collapse each of the loops above into a
  one-line call that prints only on meaningful events. Existing manual loops above are the
  concrete evidence of why: dozens of status lines per minute that an external reviewer never sees.
- ImageMagick `convert` is deprecated under IMv7 (use `magick`), and `-annotate` failed with
  "unable to read font" until a pinned macOS font path (`/System/Library/Fonts/*.ttf`) is supplied
  and `-pointsize`/gravity are set explicitly.

## 8. Keep a spike report closed: one decision verb per question
- S1 closed 4/4 (D1 ADOPT + MODIFY density-stays-app-level; D2 ADOPT 3 enums + DEFER imagery→S3 /
  emphasis→S2; D3 DEFER emphasis-as-targetId; D4 ADOPT provenance reuse + traversal). Each has
  evidence + a failure mode. The review approved 5/5 on the evidence, not on the report prose —
  but the closed-decision structure is what let the implementer proceed without re-litigating.
- S6/S2 briefs follow the same "hypothesis falsifiable → questions w/ evidence → D1..D5 CLOSED →
  implementer spec → failure modes → open questions" shape; copy it verbatim for future spikes.

## 9. The 1-commit-opens-git-history discipline still caught dirt
- `git status` after a long round showed only pre-existing untracked build artifacts
  (`.flutter-plugins-dependencies`, `graphify-out/`, `test/failures/`) — the additive-only + small-commit
  rules kept the tree clean through a full spike→impl→review→approve cycle. Keep doing this; it is
  what makes "regenerate everything" (`regen.ts` / re-gen all 9 apps) painless at round end.