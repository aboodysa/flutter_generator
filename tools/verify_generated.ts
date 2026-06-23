import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';

const repoRoot = process.cwd();
const generatedDir = resolve(repoRoot, 'lib', 'generated', 'screens');

export function listGeneratedFiles(): string[] {
  return [
    'splash_screen.dart',
    'phone_input_screen.dart',
    'home_screen.dart',
    'payment_screen.dart',
  ];
}

function verifyImports(source: string, filePath: string): string[] {
  const errors: string[] = [];
  const importLines = source
    .split(/\r?\n/)
    .filter(line => line.startsWith('import '));

  for (const line of importLines) {
    const match = line.match(/import\s+'([^']+)';/);
    if (!match) continue;
    const target = match[1];
    if (target.startsWith('package:')) continue;
    if (target.startsWith('../') || target.startsWith('../../') || target.startsWith('./')) {
      const resolved = resolve(dirname(filePath), target);
      if (!existsSync(resolved)) {
        errors.push(`${filePath}: missing import target ${target}`);
      }
    }
  }

  return errors;
}

export function verifyGeneratedFile(fileName: string): string[] {
  const filePath = resolve(generatedDir, fileName);
  const errors: string[] = [];
  if (!existsSync(filePath)) {
    errors.push(`Missing generated file: ${filePath}`);
    return errors;
  }

  const source = readFileSync(filePath, 'utf-8');
  const requiredHeader = '// GENERATED CODE - DO NOT MODIFY BY HAND.';
  if (!source.includes(requiredHeader)) {
    errors.push(`${fileName}: missing generated header`);
  }

  const forbiddenPatterns = [
    /===/,
    /\bundefined\b/,
    /\bScaffold\b/,
    /\bAppBar\b/,
    /generated\/generated/,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(source)) {
      errors.push(`${fileName}: matched forbidden pattern ${pattern}`);
    }
  }

  errors.push(...verifyImports(source, filePath));
  return errors;
}

export function main(): void {
  const errors = listGeneratedFiles().flatMap(verifyGeneratedFile);
  if (errors.length > 0) {
    console.error('Generated Dart verification failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Generated Dart verification passed');
}

if (require.main === module) {
  main();
}
