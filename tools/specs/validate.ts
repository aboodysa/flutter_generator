import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = process.cwd();
const SPECS_DIR = path.resolve(PROJECT_ROOT, 'specs');

interface ValidationError {
  file: string;
  message: string;
}

const errors: ValidationError[] = [];
const warnings: string[] = [];

function readJSON(filePath: string): any {
  const fullPath = path.resolve(PROJECT_ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    errors.push({ file: filePath, message: 'File not found' });
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  } catch (e: any) {
    errors.push({ file: filePath, message: `Invalid JSON: ${e.message}` });
    return null;
  }
}

function checkNoFlutterNames(obj: any, filePath: string, context: string) {
  const flutterPatterns = [
    /\bAppScaffold\b/, /\bAppBar\b/, /\bAppButton\b/, /\bAppCard\b/,
    /\bAppTextField\b/, /\bAppBottomNav\b/, /\bAppTopBar\b/,
    /\bAppSearchField\b/, /\bAppSegmentedControl\b/, /\bAppChipGroup\b/,
    /\bAppBanner\b/, /\bAppBottomSheet\b/, /\bAppPhoneField\b/,
    /\bAppSelectField\b/, /\bScaffold\b/, /\bMaterialApp\b/,
  ];
  const str = JSON.stringify(obj);
  for (const pattern of flutterPatterns) {
    if (pattern.test(str)) {
      errors.push({ file: filePath, message: `Contains Flutter class name matching "${pattern.source}" in ${context}` });
    }
  }
}

function checkNoHexColors(obj: any, filePath: string) {
  const str = JSON.stringify(obj);
  const hexPattern = /#[0-9A-Fa-f]{6}/g;
  const matches = str.match(hexPattern);
  if (matches) {
    errors.push({ file: filePath, message: `Contains raw hex color(s): ${matches.join(', ')}` });
  }
}

function validateProductSpec(data: any, filePath: string) {
  if (!data) return;
  const required = ['id', 'name', 'route', 'role', 'purpose'];
  for (const field of required) {
    if (!data[field]) errors.push({ file: filePath, message: `Missing required field: ${field}` });
  }
  checkNoFlutterNames(data, filePath, 'product spec');
}

function validateUiSpec(data: any, filePath: string) {
  if (!data) return;
  if (!data.screenId) errors.push({ file: filePath, message: 'Missing screenId' });
  if (!data.usesProductSpec) errors.push({ file: filePath, message: 'Missing usesProductSpec reference' });
  if (!data.layout || !data.layout.type) errors.push({ file: filePath, message: 'Missing layout.type' });
  checkNoFlutterNames(data, filePath, 'UI spec');
  checkNoHexColors(data, filePath);
}

function validateDesignSpec(data: any, filePath: string) {
  if (!data) return;
  if (!data.colors) errors.push({ file: filePath, message: 'Missing colors' });
  if (!data.typography) errors.push({ file: filePath, message: 'Missing typography' });
  checkNoFlutterNames(data, filePath, 'design spec');
}

function validateComponents(data: any, filePath: string) {
  if (!Array.isArray(data)) {
    errors.push({ file: filePath, message: 'Components must be an array' });
    return;
  }
  for (const comp of data) {
    if (!comp.id) errors.push({ file: filePath, message: `Component missing id` });
    if (!comp.purpose) warnings.push(`${filePath}: ${comp.id} missing purpose`);
  }
  checkNoFlutterNames(data, filePath, 'components');
}

function validateBindingSpec(data: any, filePath: string) {
  if (!data) return;
  if (data.target !== 'flutter') errors.push({ file: filePath, message: `Target must be "flutter", got "${data.target}"` });
  if (!data.componentMap) errors.push({ file: filePath, message: 'Missing componentMap' });
}

function validateManifest(data: any, filePath: string) {
  if (!data) return;
  if (!data.app) errors.push({ file: filePath, message: 'Missing app name' });
  if (!data.initialRoute) errors.push({ file: filePath, message: 'Missing initialRoute' });
  if (!Array.isArray(data.screens) || data.screens.length === 0) {
    errors.push({ file: filePath, message: 'Missing or empty screens array' });
    return;
  }
  const screenIds = new Set<string>();
  const routes = new Set<string>();
  for (const screen of data.screens) {
    if (!screen.screenId) errors.push({ file: filePath, message: 'Screen missing screenId' });
    if (!screen.route) errors.push({ file: filePath, message: `Screen ${screen.screenId} missing route` });
    if (!screen.generatedClass) errors.push({ file: filePath, message: `Screen ${screen.screenId} missing generatedClass` });
    if (screen.screenId) {
      if (screenIds.has(screen.screenId)) errors.push({ file: filePath, message: `Duplicate screenId: ${screen.screenId}` });
      screenIds.add(screen.screenId);
    }
    if (screen.route) {
      if (routes.has(screen.route)) errors.push({ file: filePath, message: `Duplicate route: ${screen.route}` });
      routes.add(screen.route);
    }
  }
  const initialExists = data.screens.some((s: any) => s.route === data.initialRoute);
  if (!initialExists) errors.push({ file: filePath, message: `initialRoute "${data.initialRoute}" not found in screens` });
}

console.log(`\n🔍 FAHS Spec Validator\n`);
console.log(`Project root: ${PROJECT_ROOT}`);
console.log(`Specs directory: ${SPECS_DIR}\n`);

// Load manifest first
const manifest = readJSON('specs/manifest.json');
validateManifest(manifest, 'specs/manifest.json');

// Validate screens from manifest
if (manifest && manifest.screens) {
  for (const screen of manifest.screens) {
    if (screen.specs) {
      const productPath = screen.specs.product;
      const uiPath = screen.specs.ui;
      
      const productData = readJSON(productPath);
      validateProductSpec(productData, productPath);
      
      const uiData = readJSON(uiPath);
      validateUiSpec(uiData, uiPath);
      
      // Check UI references existing product spec
      if (uiData && uiData.usesProductSpec !== productPath) {
        warnings.push(`${uiPath}: usesProductSpec "${uiData.usesProductSpec}" doesn't match expected "${productPath}"`);
      }
    }
  }
}

// Validate design specs
const tokens = readJSON('specs/design/tokens.json');
validateDesignSpec(tokens, 'specs/design/tokens.json');

const components = readJSON('specs/design/components.json');
validateComponents(components, 'specs/design/components.json');

const patterns = readJSON('specs/design/patterns.json');
const icons = readJSON('specs/design/icons.json');

// Validate binding specs
const componentMap = readJSON('specs/bindings/flutter/component-map.json');
validateBindingSpec(componentMap, 'specs/bindings/flutter/component-map.json');

const styleMap = readJSON('specs/bindings/flutter/style-map.json');

// Check component map covers all abstract components from components.json
if (componentMap && componentMap.componentMap && components) {
  const boundTypes = new Set(Object.keys(componentMap.componentMap));
  for (const comp of components) {
    if (comp.id && !boundTypes.has(comp.id)) {
      warnings.push(`Abstract component "${comp.id}" has no Flutter binding in component-map.json`);
    }
  }
}

// Report results
console.log(`Errors: ${errors.length}`);
for (const err of errors) {
  console.log(`  ❌ ${err.file}: ${err.message}`);
}

console.log(`\nWarnings: ${warnings.length}`);
for (const w of warnings) {
  console.log(`  ⚠️  ${w}`);
}

if (errors.length > 0) {
  console.log('\n❌ Validation FAILED');
  process.exit(1);
} else {
  console.log('\n✅ Validation PASSED');
  process.exit(0);
}
