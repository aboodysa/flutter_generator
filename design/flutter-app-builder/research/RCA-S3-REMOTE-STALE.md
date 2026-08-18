# RCA — Silent remote-stale spike lane (S3 brief "missing")

**Date:** 2026-08-18
**Severity:** high (lost ~2h of S3 spike time to a stale remote repo + wasted agent turn)
**Lane:** germany3 (remote spike), root@tracematrix.businessanalystcrew.org `/root/fg-p5`

## 1. Symptom

The freshly-created S3 spike lane reported `S3_SPIKE_BRIEF.md is missing from the repo (no file,
no Q1-Q5 defined anywhere)` and opened an interactive prompt asking whether to reconstruct scope
from the roadmap. The brief HAD been committed (`9fa7335`) and pushed to origin/master earlier
that session.

## 2. Investigation

- `ls /root/fg-p5/design/flutter-app-builder/research/S3_SPIKE_BRIEF.md` → **No such file**.
- `git log --oneline -1` on the remote → **`d937b02`** (the S1 showcase commit), while origin had
  advanced to `d4e5498` (22 commits behind).
- `git merge --ff-only origin/master` printed `Aborting` / `Updating d937b02..d4e5498` — a
  **silent partial failure**: the merge aborted because a stale **untracked** copy of
  `research/SPIKE_S2_REPORT.md` (manually scp'd to the box earlier) would have been overwritten by
  the merge. Git's merge abort message went to the tail of the previous pull attempt's output and
  was missed; HEAD stayed at `d937b02`.
- `git status -s` → `?? design/flutter-app-builder/research/SPIKE_S2_REPORT.md` — the culprit
  untracked file.
- Because the merge aborted silently, every later `git log --oneline -1` still showed the pushed
  branch name resolution via `origin/master` fetch — but the **working tree/HEAD** never moved. The
  lane (and this orchestrator's earlier `git rev-parse`-free checks) mistook "fetch worked" for
  "repo is current".

## 3. Root cause

`git merge --ff-only` **aborted on an untracked file collision** (the untracked
`SPIKE_S2_REPORT.md` would be clobbered by the merge), and the abort was not surfaced:
- The abort happened in a chain whose `tail` truncated the visible output.
- My polling checked `git log` (shows the fetched remote ref after `git fetch`, NOT the working
  tree HEAD) instead of `git rev-parse HEAD` + `git status -s` + a HEAD==origin/master assertion.

The stale file came from an earlier manual scp of the S2 report to the box (rule-12 file sync)
which then collided with the tracked version once S2 was committed.

## 4. Fix

1. Preserved the stale file (`cp … /tmp/SPIKE_S2_REPORT.stale`), removed the untracked collision,
   ran `git merge --ff-only origin/master` → fast-forwarded to `d4e5498`.
2. Verified with `git rev-parse --short HEAD` + `git status -s | wc -l` (0 dirty files) +
   `ls design/flutter-app-builder/research/S3_SPIKE_BRIEF.md` (present).
3. Killed + recreated `germany3` fresh (CONTEXT_POLICY rule 4 — the lane's context was polluted
   with pre-S1/S2 code reads), re-dispatched S3 with an explicit note that the repo is now at
   `d4e5498` and the brief exists.
4. Verified the lane is processing (context meter 8.5K and climbing).

## 5. Logic / rationale

Fast-forward merge aborts on untracked-file collisions are a git feature (protects uncommitted
work), but here the "uncommitted work" was a stale duplicate — so the abort bought nothing and
cost the lane its working tree freshness. The correct check for "is the box current" is
`git rev-parse HEAD` == `git rev-parse origin/master` **after** a merge that is asserted to have
run, plus a clean `git status`. Alternatives rejected: `git reset --hard origin/master` (would
destroy real local changes — none existed, but the rule is additive-only and reset-hard is a
deletion); leaving the lane to "reconstruct scope" (would have produced a brief-shaped report
against stale code — wrong evidence base).

## 6. Verification

```
# before: HEAD stale, brief missing, untracked collision present
git rev-parse HEAD                     → d937b02
ls research/S3_SPIKE_BRIEF.md          → No such file
git status -s                          → ?? design/…/SPIKE_S2_REPORT.md

# fix applied
cp research/SPIKE_S2_REPORT.md /tmp/…stale && rm research/SPIKE_S2_REPORT.md
git merge --ff-only origin/master      → Updating d937b02..d4e5498
git rev-parse --short HEAD             → d4e5498
git status -s | wc -l                  → 0
ls research/S3_SPIKE_BRIEF.md          → present
```

## 7. Prevention

- **Post-pull assertion, always:** after any remote sync, run `git rev-parse HEAD` and assert it
  equals `git rev-parse origin/master` (or the expected commit) + `git status -s` empty — never
  trust a `git fetch` or `git log origin/master` as proof the working tree moved.
- **Untracked-file hygiene:** when scp'ing a report to the box for a lane, place it OUTSIDE the
  repo tree (e.g. `/root/fg-p5/_incoming/` or `/tmp/`) or `.gitignore` it, so it can never
  collide with a later tracked version.
- Add the HEAD==origin assertion to the lane-dispatch preflight (checked before sending any
  spike brief to a fresh lane).

## 8. Follow-up

- S3 spike re-dispatched against current `d4e5498`; verify `SPIKE_S3_REPORT.md` appears, then
  review + commit decisions.
- Consider a `.gitignore` entry for the research/_incoming pattern or a preflight script under
  `tools/orchestrator-kit/`.
