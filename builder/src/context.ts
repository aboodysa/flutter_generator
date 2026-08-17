import * as fs from "fs";
import * as path from "path";

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
  // S-HERMETIC (ratified #3): resolved from the app's own committed `pubspec.lock` at generation
  // time — never a hardcoded literal again (the prior "intl-0.19.0" claim staled the moment
  // ledgerly's lock actually resolved intl 0.20.2; a defensive record that silently contradicts
  // reality is worse than no record). Omitted entirely when no lock is present yet (first
  // generation, before any `pub get`) or the lock has no intl entry (non-locale apps).
  localeDataVersion?: string;
  fontVersion: string;
}

// S-HERMETIC (ratified #3): pure read of a COMMITTED input (the app's own prior-generation
// `pubspec.lock`, sitting in outDir from the last `flutter pub get` + commit) — no network, no
// wall clock, so buildLockfile stays a deterministic function of (irVersion, outDir's on-disk
// state), consistent with [determinism]/[plan-determinism]'s L1 purity invariant.
function resolveIntlVersion(outDir: string): string | undefined {
  const lockPath = path.join(outDir, "pubspec.lock");
  if (!fs.existsSync(lockPath)) return undefined;
  const src = fs.readFileSync(lockPath, "utf8");
  const m = src.match(/^  intl:\n(?:.+\n)*?    version:\s*"?([^"\n]+?)"?\s*$/m);
  return m?.[1];
}

export function buildLockfile(irVersion: string, outDir: string): Lockfile {
  const localeDataVersion = resolveIntlVersion(outDir);
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
    ...(localeDataVersion ? { localeDataVersion } : {}),
    fontVersion: "tajawal-1",
  };
}
