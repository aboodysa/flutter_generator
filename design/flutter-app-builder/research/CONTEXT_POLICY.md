# Context Policy — objective-scoped, artifact-backed, restartable sessions

**Source:** ChatGPT review of the Claude session (2026-08-18) + existing AGENTS.md §"Context / token discipline" + `OPERATING_PRINCIPLES.md`. Binding for all lanes (local Claude, remote opencode, subagents).

## The signal that drives this policy

> 70% of usage was at >150k context. The main optimization target is not fewer tool calls — it's
> preventing long-lived sessions from accumulating context.

## Rules

1. **Treat each objective as an independent execution unit.** One objective = one fresh session
   (when objectives are independent). The pipeline:

   ```
   Objective → Fresh session → Execute autonomously → Checkpoint/evidence → Compact if continuing
   → Fresh session for next independent objective
   ```

2. **Start independent objectives in a fresh session.** Never carry stale conversational context into
   a new spike. Pass **brief/report file paths**, not the previous conversation.
   - Remote spikes: `S1 → fresh`, `S2 → fresh`, `S6 → fresh`, `implementation → fresh`, `review → fresh`.
3. **Prefer repository artifacts as durable state.** Briefs, spike reports, tests, evidence docs,
   `HANDOFF.md`, `CODE_CATALOGUE.md` — the disk is the memory; the session is disposable.
   Do not rely on conversational history as project memory.
4. **Compact during unusually long objectives when context becomes large** (e.g. >100k mid-slice).
   Do not rely on compact as the primary mechanism — restart is the default, compact is the exception.
5. **Checkpoint → compact or restart → resume from artifacts** when context pressure is detected.
6. **Progress reporting must be observable without becoming context accumulation.**
   - L1: `S1 → IMPLEMENT → 70%`
   - L2: `[DECISION] D2 → ADOPT` / `[VERIFY] regression suite → PASS`
   - L3: detailed execution
   - Do NOT continuously narrate execution into the conversation — that narration IS context.

## Decision help

| Situation | Do |
|---|---|
| New objective, unrelated to current | `/clear` (or kill+fresh remote), point at brief/report |
| Mid-slice, context growing | `/compact`, keep working |
| Slice boundary (P1→P2), independent next task | `/clear`, fresh session |
| Objective done, next slice is optional/nice | checkpoint + `/clear`; queue optional slice as its own objective |
| Remote channel idle with old backlog | kill-session, fresh, relaunch |
| Usage >150k on a loop channel | `/compact` immediately, plan `/clear` at next boundary |

## Metrics to watch

- Session context size (Claude: `~NNNk uncached` / usage screen).
- Remote opencode: `NNN.K (NN%)` in the status bar — kill+fresh past ~50-60% when the objective is done.
- The 2026-08-18 audit: ~95% of usage from sessions >150k; ~92% from sessions active 8+ hours.
  Both are symptoms of "one giant session per project" — the fix is rules 1-6, not designing around quota.