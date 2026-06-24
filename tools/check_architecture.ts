import * as fs from 'fs';
import * as path from 'path';

type Violation = {
  file: string;
  message: string;
};

const repoRoot = process.cwd();
const generatedScreensDir = path.resolve(repoRoot, 'lib', 'generated', 'screens');
const uiSpecsDir = path.resolve(repoRoot, 'specs', 'ui');
const productSpecsDir = path.resolve(repoRoot, 'specs', 'product');
const generatorSource = path.resolve(repoRoot, 'tools', 'generate_flutter.ts');

const generatedForbiddenPatterns = [
  /context\.goNamed/,
  /package:go_router/,
  /\bNavigator\./,
  /\bScaffold\(/,
  /\bAppBar\(/,
  /UnsupportedSpecWidget/,
];

const specForbiddenPatterns = [
  /\bcontext\.goNamed\b/,
  /package:go_router/,
  /\bNavigator\./,
  /\bScaffold\b/,
  /\bAppBar\b/,
  /\bBlocProvider\b/,
  /\bTextAlign\.(right|left)\b/,
  /\bAlignment\.(centerRight|centerLeft)\b/,
  /\bAppActionDispatcher\b/,
];

const generatorForbiddenPatterns = [
  /context\.goNamed/,
  /package:go_router/,
  /\bNavigator\./,
];

function collectFiles(dir: string, extension: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, extension));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  return files;
}

function scanText(text: string, patterns: RegExp[], file: string): Violation[] {
  const violations: Violation[] = [];
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      violations.push({
        file,
        message: `matched forbidden pattern ${pattern}`,
      });
    }
  }
  return violations;
}

function scanGeneratedScreens(): Violation[] {
  return collectFiles(generatedScreensDir, '.dart').flatMap(file => {
    const source = fs.readFileSync(file, 'utf-8');
    return scanText(source, generatedForbiddenPatterns, file);
  });
}

function scanSpecFile(file: string): Violation[] {
  const source = fs.readFileSync(file, 'utf-8');
  return scanText(source, specForbiddenPatterns, file);
}

function scanSpecs(): Violation[] {
  const files = [
    ...collectFiles(uiSpecsDir, '.json'),
    ...collectFiles(productSpecsDir, '.json'),
  ];
  return files.flatMap(scanSpecFile);
}

function scanGeneratorSource(): Violation[] {
  if (!fs.existsSync(generatorSource)) return [];
  const source = fs.readFileSync(generatorSource, 'utf-8');
  return scanText(source, generatorForbiddenPatterns, generatorSource);
}

function main() {
  const violations = [
    ...scanGeneratedScreens(),
    ...scanSpecs(),
    ...scanGeneratorSource(),
  ];

  if (violations.length === 0) {
    console.log('Architecture compliance passed');
    return;
  }

  console.error('Architecture compliance failed:');
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.message}`);
  }
  process.exit(1);
}

if (require.main === module) {
  main();
}
