# Research Results (Tier-One)

> Dedicated research-evidence document. Tool comparison lives in `BENCHMARK.md`; this file is the peer-reviewed/tier-one research findings and what they mean for the design.

---

## Executive Summary

Four findings shape the whole design:

1. **LLM codegen reliability is over-rated** — benchmark scores reflect contamination/memorization, not reasoning; hallucinated packages are a real supply-chain risk; ~40% of raw LLM output has security flaws.
2. **Agents fail at the edit, not the search** ("coherence collapse") — 60–69% of failures reach the *correct* function and then break it. This is the single most important failure mode our oracle + invariants design must defend against.
3. **LLM-as-judge is unreliable** — judges agree with humans only ~62% of the time and directly contradict ~9.5%; executable tests beat both. ⇒ *LLM judges are triage, never certification.*
4. **The field independently validates our architecture** — peer-reviewed work does "LLM generates the model, not code, validated against a metamodel" (MODELS 2024); Athena concludes structural IRs are *necessary* because pure LLM generation is inconsistent.

---

## Source-Quality Legend

- 🟢 **Peer-reviewed** — published in a top venue (IEEE S&P, ICSE, MODELS/ACM-IEEE).
- 🟡 **Preprint / benchmark** — arXiv, not yet peer-reviewed (flagged).
- ⚪ **Vendor / industry-reported** — not academic (flagged; treated as low-confidence).

---

## 1. LLM Code-Generation Reliability

### 1.1 Benchmark scores overstate generalizable reasoning
**Finding:** SOTA models hit 76% accuracy identifying buggy file paths from issue text alone on SWE-bench-Verified repos, but drop to 53% on structurally similar *out-of-benchmark* repos — the gap points to contamination/memorization, not reasoning.
**Source:** *The SWE-Bench Illusion*, ICSE 2026, Microsoft Research. 🟢 [arXiv:2506.12286](https://arxiv.org/abs/2506.12286), [ACM 10.1145/3786583.3786882](https://dl.acm.org/doi/10.1145/3786583.3786882)
**Design implication:** never use raw benchmark Pass@1 numbers as evidence of correctness. Our Phase 3 funding gate is *our own* measured rule-language coverage, not a vendor's benchmark claim.

### 1.2 Security flaws are common in raw LLM output
**Finding:** 40% of 1,689 GitHub Copilot-generated programs contained security-related flaws; a 2023 replication confirms the pattern persists.
**Source:** Pearce et al., *"Asleep at the Keyboard?"*, IEEE S&P 2022. 🟢 [arXiv:2311.11177](https://arxiv.org/pdf/2311.11177)
**Design implication:** the LLM must not emit raw code into the project. Our structural generators + `SecurityValidator` (§20/§21) are the mitigation; this is *why* the Novel lane is gated and always human-approved.

### 1.3 Package/dependency hallucination is a supply-chain vector
**Finding:** across 576,000 samples and 16 LLMs, average hallucinated-package rate is **5.2% (commercial)** and **21.7% (open-source)**.
**Source:** Spracklen et al., *"We Have a Package for You!"*. 🟢 [arXiv:2406.10279](https://arxiv.org/abs/2406.10279)
**Design implication:** generated `pubspec.yaml` dependencies must come from a **curated allowlist**, not from the LLM. The generator resolves deps from the IR + plugin manifests; the lockfile pins them.

### 1.4 Agents fail at the edit, not the search — "coherence collapse"
**Finding:** across 16,758 trajectories, 60–69% of failures reach and edit the *correct* function, then overwrite/thrash correct code into an incorrect patch. Localization isn't the bottleneck; **edit quality is**.
**Source:** *Coherence Collapse*, 2026. 🟡 (preprint, not yet peer-reviewed) [arXiv:2603.24631](https://arxiv.org/abs/2603.24631)
**Design implication (the most important one):** a correct-looking agent edit can silently corrupt adjacent code. Mitigation is baked into Phase 3: every rule edit re-runs **all** prior examples/invariants; any decision-table row with zero coverage is an "unverifiable edit" requiring mandatory human diff review. This is why invariants must be *broad*, not spot-checked.

---

## 2. LLM-as-Judge Reliability

### 2.1 Bias is real but contested in degree
**Finding:** position bias and verbosity bias are robustly documented; **self-preference bias is an open empirical question** (one controlled study found none; another proposed a new score precisely because prior self-preference measurements were unreliable).
**Source:** Survey. 🟡 [arXiv:2412.05579](https://arxiv.org/abs/2412.05579)
**Design implication:** do not assume "a second model will disagree when the first is wrong." Treat self-preference as unsettled; make the *human oracle* the real gate (§9.4).

### 2.2 Judge agreement with humans is imperfect even for well-separated judges
**Finding:** LLM-judge and human evaluators agreed only **62.5%** and directly contradicted **9.5%** of the time on code-correctness judgments; **unit tests outperformed both** where executable ground truth existed.
**Source:** SE-Jury / SWE-Judge. 🟡 [arXiv:2505.20854](https://arxiv.org/html/2505.20854)
**Design implication (direct constraint on our architecture):** wherever an execution-based oracle (tests, invariants) is available, it beats judge-based evaluation outright. ⇒ In §9.4/§9.5, the adversarial ReviewAgent is **triage, never certification**. "Two models agree" is explicitly *not* proof of correctness.

---

## 3. Low-Code / No-Code + LLM Integration

### 3.1 Structural IRs are necessary, not optional
**Finding:** *Athena* — LLM app generation via intermediate representations — concludes "pure LLM generation produces inconsistent results," making structural IRs necessary for reliable iterative regeneration.
**Source:** Athena. 🟡 [arXiv:2508.20263](https://arxiv.org/pdf/2508.20263)
**Design implication:** validates DESIGN.md's core bet — the IR is not a nice-to-have, it is the prerequisite for iterative regeneration.

### 3.2 A peer-reviewed venue has published the same architecture pattern
**Finding:** *"Turning Low-Code Development Platforms into True No-Code with LLMs"* has the LLM generate the platform's **model** (not code), validated against the metamodel — i.e., "LLM writes into a validated IR," our exact approach.
**Source:** MODELS 2024, ACM/IEEE. 🟢 [ACM 10.1145/3652620.3688334](https://dl.acm.org/doi/10.1145/3652620.3688334)
**Design implication:** independent, peer-reviewed confirmation of the "LLM → validated IR → deterministic generator" pipeline shape.

### 3.3 No full-stack commercial precedent exists
**Finding:** the tools that stayed fully deterministic (Mendix, Appsmith, Bubble) keep their AI strictly advisory (it never writes the model). The tools whose AI *does* write into a structural layer (FlutterFlow AI Gen, Builder.io/Mitosis) cite **regen-vs-hand-edit collision** as their most visible failure mode, and neither publishes an audited merge algorithm — "region preserved" is asserted, not proven.
**Source:** primary tool docs/behavior. ⚪
**Design implication:** our content-hash region detection + 3-way merge (§11) is not copied from prior art — it fills a gap the field has acknowledged but not solved. This is the key differentiator.

---

## 4. Consolidated Design Implications (ranked)

1. **Regeneration safety is the moat.** Every competitor fails on silent regen clobber; our region-aware merge (§11) is the one thing none can demo credibly. Pull it forward into the investor demo.
2. **LLM-judge = triage, never certification.** Hard-wired into §9.4/§9.5 and the agent contract docs.
3. **Curated dependency allowlist** — the LLM never resolves packages; the generator does, from a pinned manifest.
4. **Broad invariants + full re-run on every rule edit** — the coherence-collapse defense (§15, Phase 3).
5. **Measure our own rule-language coverage** — not vendor benchmark numbers — as the Phase 3 funding gate.
6. **Component-level independent evidence, not "exact approach"** — the honest positioning; we compose validated components, we don't copy a prior art.

---

## Source Index

| # | Title | Venue | Tier | Link |
|---|---|---|---|---|
| 1 | The SWE-Bench Illusion | ICSE 2026 | 🟢 | arXiv:2506.12286 |
| 2 | Asleep at the Keyboard? | IEEE S&P 2022 | 🟢 | arXiv:2311.11177 |
| 3 | We Have a Package for You! | empirical (16 LLMs) | 🟢 | arXiv:2406.10279 |
| 4 | Coherence Collapse | preprint | 🟡 | arXiv:2603.24631 |
| 5 | LLM-as-judge survey | survey | 🟡 | arXiv:2412.05579 |
| 6 | SE-Jury / SWE-Judge | preprint | 🟡 | arXiv:2505.20854 |
| 7 | Athena (IR-based app generation) | preprint | 🟡 | arXiv:2508.20263 |
| 8 | Turning LCDPs into True No-Code with LLMs | MODELS 2024 | 🟢 | ACM 10.1145/3652620.3688334 |
