# Executive Overview — Flutter App Builder

> A one-page brief for decision-makers. Technical depth lives in `DESIGN.md`, `RESEARCH.md`, and `PHASE_PLAN.md`.

---

## The product

A **compiler that builds production Flutter apps from a spec** — not an "AI that writes Flutter code."

You describe what you want (a sentence, an API schema, a database, a design file). The system turns it into a working, tested Flutter application. The vast majority of the output is produced by **deterministic generators** (predictable, repeatable, zero hallucination). An LLM is used **only** to interpret requirements and business logic — and even then it writes into a **checked intermediate model**, never raw code.

## Why this, why now

Every "AI app builder" today has the same failure mode: the model *invents* code, and when you regenerate, it **silently destroys what a human already fixed**. Independent, peer-reviewed research confirms:

- ~40% of raw LLM code has security flaws; ~5% of suggested packages don't even exist.
- AI agents reach the right place and then break the code 60–69% of the time.
- A second AI "checking" a first AI agrees with a human only ~62% of the time — two AIs agreeing proves nothing.

Meanwhile, the market is split into two camps: **deterministic platforms** (reliable, but rigid and AI is decorative) and **LLM-first agents** (flexible, but unreliable and can't maintain code). **Nobody occupies the middle.**

## Our differentiator

We take the middle: **deterministic compilation + a disciplined reasoning lane + regeneration safety.**

| Capability | Competitors | Us |
|---|---|---|
| Regenerate without clobbering human edits | ❌ everyone fails here | ✅ region-aware, hash-verified merge |
| Code is correct, not just "looks right" | ❌ no independent check | ✅ human-attested examples + executable tests |
| LLM can't silently overreach | ❌ the model decides | ✅ field-level access control; human approval gates |
| Works for any style of app | ❌ one framework style | ✅ pluggable architecture (Riverpod/Bloc, etc.) |

The **regeneration-safety** piece is the moat: it is the one thing no competitor can currently demo, and it is the single most-reported complaint across the field.

## Proof of concept of the *approach*

A peer-reviewed paper (MODELS 2024) and the Athena project independently reached the same architecture — "LLM generates a validated model, not code" — because pure LLM generation is provably inconsistent. We are composing components the field has already validated, not betting on unproven territory.

## Effort & plan

Five phases. **A demoable vertical slice in ~one sprint** (one entity + a business rule + regeneration safety — the beat no competitor can fake). A v1 (greenfield generation, deterministic core + reasoning lane) at the end of Phase 3. Full hardening (brownfield import, novel-code lane) post-v1.

| Phase | What | Outcome |
|---|---|---|
| 0 | Stratified vertical slice | Prove the model is right, cheaply |
| 1 | Deterministic compiler (no AI) | Reliable codegen core |
| 2 | Patterns & plugins | Breadth across app types |
| 3 | AI reasoning lane | **v1 release** |
| 4 | Hardening | Durability, brownfield |

## Key risks & how they're handled

| Risk | Mitigation |
|---|---|
| AI generates subtly wrong business logic | Human-attested examples + executable invariants; "two AIs agree" is never treated as proof |
| Regeneration destroys human work | Region-aware merge — the core differentiator, built first |
| Wrong IR design, discovered late | Phase 0 exists precisely to find this cheaply |
| LLM overreaches its authority | Field-level write control; critical decisions always human-approved |

## What's decided vs. what's open

**Decided:** architecture, generation matrix, the trust/approval model, the correctness model, privacy policy, and the full phase plan — hardened through adversarial review (19 findings resolved) and cross-checked against three independent models and tier-one research.

**Open:** none blocking. Start Phase 0.

## Next step

Draft the 6 schemas and walk the first vertical slice. This is the cheapest, fastest proof that the entire thesis holds before any large engineering investment.
