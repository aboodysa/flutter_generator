import * as fs from 'fs';
import * as path from 'path';
import { GenerationContext, Generator, Manifest } from '../core/types';

function toFilePath(screenId: string): string {
  return screenId.replace(/-/g, '_');
}

function toDisplayTitle(name: string): string {
  return name.replace(/Screen$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
}

function generateRouter(manifest: Manifest): string {
  const imports = manifest.screens
    .map(s => `import '../screens/${toFilePath(s.screenId)}_screen.dart';`)
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

  const entries = manifest.screens
    .map(s => `  GeneratedScreenEntry(screenId: '${s.screenId}', title: '${toDisplayTitle(s.name)}', route: '${s.route}')`)
    .join(',\n');

  return `// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/manifest.json
// Generator: tools/generate_router.ts

import 'package:go_router/go_router.dart';
${imports}

class GeneratedScreenEntry {
  const GeneratedScreenEntry({
    required this.screenId,
    required this.title,
    required this.route,
  });

  final String screenId;
  final String title;
  final String route;
}

final generatedInitialLocation = '${manifest.initialRoute}';

const generatedScreenEntries = <GeneratedScreenEntry>[
${entries},
];

final generatedRoutes = <RouteBase>[
${routes},
];

final generatedAppRouter = GoRouter(
  initialLocation: generatedInitialLocation,
  routes: generatedRoutes,
);
`;
}

export class RouterGenerator implements Generator {
  readonly name = 'router';

  async generate(context: GenerationContext): Promise<void> {
    const outputDir = path.join(context.outputRoot, 'generated', 'app');
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, 'router.g.dart');
    fs.writeFileSync(outputPath, generateRouter(context.manifest), 'utf-8');
    console.log(`✅ Generated router: ${outputPath}`);
    console.log(`   Routes: ${context.manifest.screens.length}`);
  }
}
