/**
 * Provenance + approval gating (DESIGN §2.2, §9.2–9.3).
 * Every IR element carries an `actor` derived from the pipeline stage credential,
 * never from a self-attested claim inside the payload. Agent (LLM) output is
 * tagged `origin: llm-inferred` + `requiresApproval: true` and is BLOCKED from
 * generation until a human attests `actor: human:attested`.
 *
 * DEFERRED (SOLID review #9, P3b): this is a flat binary gate (requiresApproval + a single
 * humanAttest/humanAttestAll). DESIGN §9.5's Tier R (reversible, batched/deferrable) vs Tier I
 * (irreversible/high blast-radius, always solo + blocking) routing is not implemented — every
 * element goes through the same path regardless of reversibility or blast radius. Intentionally
 * not built here; scope it as its own slice when P3b closure is picked up.
 */

export interface Provenance {
  actor?: string;
  origin?: "deterministic" | "schema-structural" | "schema-interpreted" | "llm-inferred" | "human-confirmed";
  confidence?: number;
  confidenceSource?: "deterministic" | "second-party" | "human-attested";
  requiresApproval?: boolean;
  source?: string[];
}

export const HUMAN_ACTOR = "human:attested";

// S1 (SPIKE_S1_REPORT.md §14.4, D4): ScreenModel.visualStyle's three optional sub-fields are each
// their own Provenance-shaped envelope (types.ts's `VisualStyleValue<T> extends Provenance`) — one
// level deeper than the existing `.fields` array recursion. A generic "has a `value` + is an
// object" walker keeps this reusable without hardcoding the key list at every call site.
const VISUAL_STYLE_KEYS = ["hierarchy", "cornerRadius", "personality"] as const;

/** Nested VisualStyleValue envelopes present on an element's `visualStyle` (S1, D4). */
function visualStyleEnvelopes(el: any): Array<{ key: string; envelope: any }> {
  if (!el || typeof el !== "object" || !el.visualStyle || typeof el.visualStyle !== "object") return [];
  return VISUAL_STYLE_KEYS
    .filter((k) => el.visualStyle[k] && typeof el.visualStyle[k] === "object")
    .map((k) => ({ key: k, envelope: el.visualStyle[k] }));
}

/** Stamp an element (and its nested fields + visualStyle envelopes) with agent provenance. */
function stampElement(el: any, agent: string, origin: string, confidence: number): void {
  if (!el || typeof el !== "object") return;
  el.actor = `agent:${agent}`;
  el.origin = origin;
  el.confidence = confidence;
  el.confidenceSource = "second-party";
  el.requiresApproval = origin !== "deterministic";
  if (Array.isArray(el.fields)) el.fields.forEach((f: any) => stampElement(f, agent, origin, confidence));
  // S1 (D4): each declared visualStyle sub-field is its own envelope — stamped (and later
  // attested/blocked) independently of the screen element itself.
  for (const { envelope } of visualStyleEnvelopes(el)) stampElement(envelope, agent, origin, confidence);
}

/** Tag every top-level IR element (and its fields) with agent provenance. */
export function stampAgentProvenance(ir: any, agent: string, origin = "llm-inferred", confidence = 0.6): any {
  for (const [kind, items] of Object.entries(ir)) {
    if (Array.isArray(items)) items.forEach((el: any) => stampElement(el, agent, origin, confidence));
  }
  return ir;
}

/** A human attests approval over an element (or the whole IR) — the approval gate. */
export function humanAttest(element: any): void {
  if (!element || typeof element !== "object") return;
  element.actor = HUMAN_ACTOR;
  element.confidenceSource = "human-attested";
  element.confidence = 1.0;
  element.requiresApproval = false;
  if (Array.isArray(element.fields)) element.fields.forEach((f: any) => humanAttest(f));
  // S1 (D4): attest every declared visualStyle sub-field too — no silent promotion of the parent
  // screen attesting a nested value it never actually confirmed.
  for (const { envelope } of visualStyleEnvelopes(element)) humanAttest(envelope);
}

export function humanAttestAll(ir: any): any {
  for (const [kind, items] of Object.entries(ir)) {
    if (Array.isArray(items)) items.forEach((el: any) => humanAttest(el));
  }
  return ir;
}

/** Elements that are LLM-inferred (or otherwise require approval) but not yet human-attested. */
export function unapprovedElements(ir: any): string[] {
  const out: string[] = [];
  for (const [kind, items] of Object.entries(ir)) {
    if (!Array.isArray(items)) continue;
    items.forEach((el: any, i: number) => {
      if (el && el.requiresApproval === true && el.actor !== HUMAN_ACTOR) {
        out.push(`${kind}[${i}] '${el.name ?? "unnamed"}' (origin=${el.origin ?? "?"}, actor=${el.actor ?? "none"})`);
      }
      // S1 (D4): a screen can be fully human-confirmed itself while still carrying an unattested
      // (or re-flagged, e.g. the negative control) nested visualStyle value — checked independently
      // so it BLOCKS generation without the parent element's own flag ever needing to be true.
      for (const { key, envelope } of visualStyleEnvelopes(el)) {
        if (envelope.requiresApproval === true && envelope.actor !== HUMAN_ACTOR) {
          out.push(`${kind}[${i}].visualStyle.${key} '${el?.name ?? "unnamed"}' (origin=${envelope.origin ?? "?"}, actor=${envelope.actor ?? "none"})`);
        }
      }
    });
  }
  return out;
}
