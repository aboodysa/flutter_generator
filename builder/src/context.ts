/**
 * GenerationContext + lockfile (DESIGN §6.3, §23).
 * The lockfile pins the exact GenerationContext tuple so regeneration is
 * reproducible and 3-way merge bases are byte-reproducible:
 *   { irVersion, plugin+template versions, generatorVersion, sdkConstraint, localeData, fonts }
 */

export interface PluginPin {
  strategy: string;
  version: string;
}

export interface Lockfile {
  irVersion: string;
  generatorVersion: string;
  templateVersion: string;
  sdkConstraint: string;
  plugins: Record<string, PluginPin>;
  localeDataVersion: string;
  fontVersion: string;
}

export function buildLockfile(irVersion: string): Lockfile {
  return {
    irVersion,
    generatorVersion: "1.0.0",
    templateVersion: "v1",
    sdkConstraint: ">=3.0.0",
    plugins: {
      stateManagement: { strategy: "bloc", version: "^8.1.6" },
      di: { strategy: "get_it", version: "^8.0.1" },
      routing: { strategy: "go_router", version: "^17.1.0" },
      http: { strategy: "dio", version: "^5.8.0+1" },
      serialization: { strategy: "manual", version: "none" },
      secureStorage: { strategy: "flutter_secure_storage", version: "^9.2.4" },
    },
    localeDataVersion: "intl-0.19.0",
    fontVersion: "tajawal-1",
  };
}
