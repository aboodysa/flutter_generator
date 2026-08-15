// Import-statement resolution from Dart type strings (SRP slice of the former dart.ts).

import { fileName } from "./naming";
import { PkgContext } from "./gen_context";

// Dart built-ins never generate an import.
const BUILTIN = new Set([
  "Future", "Stream", "List", "Map", "Set", "String", "int", "double", "bool",
  "dynamic", "Object", "void", "DateTime", "num", "Duration",
]);

// Scan Dart type strings for generated-type references and emit import lines.
// Only needs {pkg, symbols} (ISP: never touches ir/sm), so it accepts the narrower PkgContext —
// any full GenContext satisfies it structurally, so existing call sites are unaffected.
export function importsFromTypes(types: string[], ctx?: PkgContext): string[] {
  const refs = new Set<string>();
  for (const s of types) {
    for (const m of s.matchAll(/\b([A-Z][A-Za-z0-9]+)\b/g)) {
      const t = m[1];
      if (t && !BUILTIN.has(t)) refs.add(t);
    }
  }
  return Array.from(refs)
    .sort()
    .map((t) => {
      const p = ctx?.symbols.get(t);
      return p ? `import 'package:${ctx!.pkg}/${p}';` : `import '${fileName(t)}';`;
    });
}
