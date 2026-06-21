import * as fs from 'fs';
import * as path from 'path';

interface ScreenManifest {
  screenId: string;
  name: string;
  route: string;
  role: string;
  generatedClass: string;
}

interface Manifest {
  app: string;
  direction: string;
  initialRoute: string;
  screens: ScreenManifest[];
}

function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

function toFilePath(screenId: string): string {
  return screenId.replace(/-/g, '_');
}

function generateRouter(manifest: Manifest): string {
  const imports = manifest.screens
    .map(s => {
      const filePath = toFilePath(s.screenId);
      return `import '../screens/${filePath}_screen.dart';`;
    })
    .join('\n');

  const routes = manifest.screens
    .map(s => {
      const className = s.generatedClass;
      return `    GoRoute(
      path: '${s.route}',
      name: '${s.screenId}',
      builder: (context, state) => const ${className}(),
    )`;
    })
    .join(',\n');

  return `// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/manifest.json
// Generator: tools/generate_router.ts

import 'package:go_router/go_router.dart';
${imports}

final generatedAppRouter = GoRouter(
  initialLocation: '${manifest.initialRoute}',
  routes: [
${routes},
  ],
);
`;
}

function main() {
  const specsDir = process.argv[2] || 'specs';

  // Support --only flag for first-slice allowlist
  const onlyIndex = process.argv.indexOf('--only');
  const allowlist: string[] | null =
    onlyIndex !== -1 && process.argv.length > onlyIndex + 1
      ? process.argv[onlyIndex + 1].split(',').map(s => s.trim())
      : null;

  const manifestPath = path.join(specsDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Filter to allowlisted screens when --only is provided
  let screens = manifest.screens;
  if (allowlist) {
    screens = manifest.screens.filter(s => allowlist.includes(s.screenId));
    if (screens.length === 0) {
      console.error(`No screens matched allowlist: ${allowlist.join(', ')}`);
      process.exit(1);
    }
  }

  // Determine initial route: use first allowlisted screen's route if splash is excluded
  let initialRoute = manifest.initialRoute;
  if (allowlist && !manifest.screens.some(s => s.route === initialRoute && allowlist.includes(s.screenId))) {
    initialRoute = screens[0].route;
  }

  const filteredManifest: Manifest = { ...manifest, screens, initialRoute };
  const output = generateRouter(filteredManifest);

  const outputDir = path.join('lib', 'generated', 'app');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'router.g.dart');
  fs.writeFileSync(outputPath, output, 'utf-8');

  console.log(`✅ Generated router: ${outputPath}`);
  console.log(`   Routes: ${screens.length}`);
  if (allowlist) console.log(`   Allowlist: ${allowlist.join(', ')}`);
}

main();
