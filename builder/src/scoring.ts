import { StateModel } from "./types";

/**
 * Deterministic pattern-selection scoring function (DESIGN §5.2).
 * Chooses the state generation strategy from IR attributes — never by the LLM.
 */
export type StateStrategy = "none" | "enum-status" | "sealed-events";

export function scoreStateStrategy(s: StateModel): StateStrategy {
  const statuses = s.statuses ?? ["initial", "loading", "success", "failure"];
  const extra = s.extraFields ?? [];

  // stateComplexity = status count + extra-field count (proxy for transition surface).
  const complexity = statuses.length + extra.length;

  if (statuses.length <= 0) return "none";
  // Many statuses + derived fields → sealed-events (exhaustive matching pays for itself).
  if (complexity >= 8) return "sealed-events";
  return "enum-status";
}
