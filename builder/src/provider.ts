import { StateManagementProvider } from "./types";

/**
 * State-management provider registry (DESIGN §10 — plugin = strategy + template family +
 * conformance). The single source of truth for which providers exist, their package
 * dependencies, and their template ids. Generators consult this instead of hardcoding bloc
 * (OCP: adding a provider = one entry here + its templates).
 */

export interface ProviderDef {
  id: StateManagementProvider;
  package: string | null; // pubspec dependency (null = no dependency)
  stateTemplate: string;  // template= marker emitted by the state generator
  screenBuilder: "bloc" | "riverpod" | "none"; // how screens subscribe
  di: "get_it" | "provider_scope" | "none";
}

export const PROVIDERS: Record<StateManagementProvider, ProviderDef> = {
  none: { id: "none", package: null, stateTemplate: "state_none.v1", screenBuilder: "none", di: "none" },
  bloc: { id: "bloc", package: "flutter_bloc", stateTemplate: "state_enum_status.v1", screenBuilder: "bloc", di: "get_it" },
  riverpod: { id: "riverpod", package: "flutter_riverpod", stateTemplate: "state_notifier.v1", screenBuilder: "riverpod", di: "provider_scope" },
};

export function providerFor(id: StateManagementProvider): ProviderDef {
  return PROVIDERS[id];
}
