# Operating Principles — evidence-driven engineering discipline

**Owner distillation, 2026-08-18** (from `LESSONS_LEARNED_ROUND_2026-08-18.md`). Binding for all lanes —
load before each round. The visual lane is an evidence-driven engineering discipline, not a VLM/design
problem: it is teaching the whole pipeline how to prevent an imperfect/cheap model from becoming the
source of nondeterminism.

1. **Evidence must be independently inspectable.** Human proof: standalone PNGs. Machine proof:
   token tables, CLI output, hashes, provenance. Never assume a PDF containing images is sufficient.
2. **Every accepted review item becomes a permanent regression test.** Review feedback → test → CI.
   Temporary reviewer knowledge becomes a durable contract.
3. **Compare the same screen when proving visual-token behavior.** Keep content constant; change
   exactly one semantic variable; side-by-side extremes make token effects obvious.
4. **Never infer agent state from the prompt marker.** `❯` ≠ idle. Use meaningful state changes,
   reports, or commit SHA changes. Treat approval prompts as blocking states.
5. **Fresh context is part of correctness.** Kill stale remote sessions; start fresh; prime from the
   brief; verify the prompt actually arrived.
6. **Determinism needs both machine and human evidence.** Canonical sorted hashing proves identity;
   `diff -r` makes it inspectable; a deliberately broken assertion proves the test guards something.
7. **Automate the repetitive orchestration, not the judgment.** `poll.sh`, `dispatch_kill_fresh.sh`,
   `tgsend.sh`, etc. eliminate operational noise; human/LLM judgment stays on decisions and evidence.
8. **Spike reports terminate decisions.** Each question gets one explicit verb (ADOPT/MODIFY/DEFER/
   REJECT/ESCALATE) + evidence + failure mode + implementation consequence. No reopening closed
   questions without new evidence.
9. **Small commits preserve causal history.** Additive changes; one logical commit; clean regeneration
   at the end; pre-existing artifacts remain distinguishable from spike output.
10. **The loop shape:** Hypothesis → Spike → Evidence → Review → Regression test → Implementation →
    Determinism proof → Approval.

**Meta-lesson:** LLMs produce decisions and semantic IR; the surrounding system makes those decisions
testable, reproducible, inspectable, and cheap to operate.