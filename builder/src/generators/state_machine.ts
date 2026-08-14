import { StateMachineModel } from "../types";

/**
 * StateMachineGenerator — structural, deterministic, 0% LLM.
 * IR StateMachineModel → enum states/events + a deterministic transition table (§19.3).
 */
export function generateStateMachine(sm: StateMachineModel): string {
  const statusEnum = `${sm.name}Status`;
  const eventEnum = `${sm.name}Event`;

  const stateValues = sm.states.map((s) => `  ${s}`).join(",\n");
  const eventValues = sm.events.map((e) => `  ${e}`).join(",\n");

  // Group transitions by source state.
  const cases = sm.states
    .map((state) => {
      const ts = sm.transitions.filter((t) => t.from === state);
      if (ts.length === 0) return `      case ${statusEnum}.${state}:\n        return null; // terminal / no outgoing transitions`;
      const branches = ts
        .map((t) => `        if (event == ${eventEnum}.${t.event}) return ${statusEnum}.${t.to};${t.guard ? ` // guard: ${t.guard}` : ""}`)
        .join("\n");
      return `      case ${statusEnum}.${state}:\n${branches}\n        return null;`;
    })
    .join("\n");

  return `// [generated] generator=StateMachineGenerator template=state_machine.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
enum ${statusEnum} {\n${stateValues}\n}

enum ${eventEnum} {\n${eventValues}\n}

class ${sm.name}StateMachine {
  /// Returns the next state, or null if the transition is illegal.
  static ${statusEnum}? transition(${statusEnum} from, ${eventEnum} event) {
    switch (from) {
${cases}
    }
  }
}
`;
}
