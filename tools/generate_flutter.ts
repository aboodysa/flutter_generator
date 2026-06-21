import * as fs from 'fs';
import * as path from 'path';

interface ComponentMap {
  [key: string]: string;
}

interface ScreenManifest {
  screenId: string;
  name: string;
  route: string;
  role: string;
  generatedClass: string;
  specs: { product: string; ui: string };
}

interface Manifest {
  app: string;
  direction: string;
  initialRoute: string;
  screens: ScreenManifest[];
}

interface UiComponent {
  type: string;
  variant?: string;
  props?: Record<string, any>;
  children?: UiComponent[];
  regions?: Record<string, UiComponent>;
  action?: string;
  primaryAction?: string;
  bindsTo?: string;
  repeat?: boolean;
  spacing?: string;
  scroll?: boolean | string;
  padding?: string;
}

interface UiSpec {
  screenId: string;
  usesProductSpec: string;
  layout: {
    type: string;
    safeArea?: boolean;
    scroll?: boolean;
    regions: Record<string, UiComponent>;
  };
}

interface ActionDef {
  id: string;
  label?: string;
  type: string;
  target?: string;
  requiresValidForm?: boolean;
}

interface ProductSpec {
  id: string;
  actions?: ActionDef[];
  navigation?: { action: string; targetScreenId: string }[];
}

// Parsed configuration
let componentMap: ComponentMap = {};
let specDir = 'specs';
const mode = process.argv.includes('--mode')
  ? process.argv[process.argv.indexOf('--mode') + 1] || 'strict'
  : 'strict';
const isStrict = mode === 'strict';

function logError(msg: string) {
  console.error(`❌ ${msg}`);
  if (isStrict) process.exit(1);
}

function loadJson(relativePath: string): any {
  const fullPath = path.join(specDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    logError(`File not found: ${fullPath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

function toPascalCase(str: string): string {
  const s = str.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\s/g, '');
  return s;
}

function mapComponentType(type: string): string {
  const mapped = componentMap[type];
  if (!mapped) {
    if (isStrict) {
      logError(`Unsupported component type: "${type}". No binding found in component-map.json`);
      return 'UnsupportedSpecWidget';
    }
    return 'UnsupportedSpecWidget';
  }
  return mapped;
}

function resolveSpacing(spacing?: string): string {
  const map: Record<string, string> = {
    'xs': 'AppSpacing.xs',
    'sm': 'AppSpacing.sm',
    'md': 'AppSpacing.md',
    'lg': 'AppSpacing.lg',
    'xl': 'AppSpacing.xl',
    'xxl': 'AppSpacing.xxl',
  };
  return spacing ? map[spacing] || 'AppSpacing.md' : 'AppSpacing.md';
}

function generateComponent(comp: UiComponent, indent: string, actions: ActionDef[] = []): string {
  const type = comp.type;
  const flutterWidget = mapComponentType(type);
  const props = comp.props || {};

  if (type === 'screen') return ''; // handled at top level

  // Layout components
  if (type === 'layout.vertical') {
    const spacing = resolveSpacing(comp.spacing);
    const children = (comp.children || []).map(c => generateComponent(c, indent + '          ', actions)).join(',\n');
    return `${indent}Column(\n${indent}  spacing: ${spacing},\n${indent}  crossAxisAlignment: CrossAxisAlignment.stretch,\n${indent}  children: [\n${children}\n${indent}  ],\n${indent})`;
  }

  if (type === 'layout.horizontal') {
    const spacing = resolveSpacing(comp.spacing);
    const isScroll = comp.scroll === 'horizontal';
    const children = (comp.children || []).map(c => generateComponent(c, indent + '          ', actions)).join(',\n');
    if (isScroll) {
      return `${indent}SingleChildScrollView(\n${indent}  scrollDirection: Axis.horizontal,\n${indent}  child: Row(\n${indent}    spacing: ${spacing},\n${indent}    children: [\n${children}\n${indent}    ],\n${indent}  ),\n${indent})`;
    }
    return `${indent}Row(\n${indent}  spacing: ${spacing},\n${indent}  children: [\n${children}\n${indent}  ],\n${indent})`;
  }

  // Action buttons
  if (type === 'action.primary') {
    const label = props.label || props.buttonLabel || 'تأكيد';
    const actionId = comp.action || comp.primaryAction;
    const action = actions.find(a => a.id === actionId);
    const targetScreenId = action?.target;
    const targetRoute = targetScreenId ? `'/${targetScreenId.replace(/_/g, '-')}'` : null;

    const onPressed = targetRoute
      ? `() => context.goNamed('${targetScreenId}')`
      : '() {}';

    return `${indent}AppButton.primary(\n${indent}  '${label}',\n${indent}  onPressed: ${onPressed},\n${indent})`;
  }

  if (type === 'action.secondary') {
    const label = props.label || 'إلغاء';
    return `${indent}AppButton.outline('${label}')`;
  }

  if (type === 'action.ghost') {
    const label = props.label || 'إجراء';
    return `${indent}AppButton.ghost('${label}')`;
  }

  // Component types
  if (type === 'component.appHeader') {
    const title = props.title || '';
    return `${indent}AppTopBar(title: '${title}', showBack: ${props.leading === 'back' || props.leading === 'close'})`;
  }

  if (type === 'component.logoHeader') {
    return `${indent}const LogoHeader()`;
  }

  if (type === 'component.banner') {
    const title = props.title || '';
    const subtitle = props.subtitle || '';
    const variant = comp.variant || 'default';
    if (variant === 'peach') {
      return `${indent}AppBanner.peach(title: '${title}', subtitle: '${subtitle}')`;
    }
    return `${indent}AppBanner(title: '${title}', subtitle: '${subtitle}')`;
  }

  if (type === 'component.summaryBanner') {
    return `${indent}SummaryBanner(title: '${props.title || ''}', subtitle: '${props.subtitle || ''}', price: '${props.price || ''}')`;
  }

  if (type === 'component.card') {
    const label = props.label || '';
    const variant = comp.variant || 'default';
    const actionId = comp.action;
    const action = actions.find(a => a.id === actionId);
    const targetScreenId = action?.target;
    const onTap = targetScreenId ? `onTap: () => context.goNamed('${targetScreenId}')` : '';

    if (variant === 'peach') {
      return `${indent}GestureDetector(\n${indent}  ${onTap},\n${indent}  child: AppCard.peach(\n${indent}    child: Text('${label}', style: AppTextStyles.title),\n${indent}  ),\n${indent})`;
    }
    if (variant === 'lavender') {
      return `${indent}GestureDetector(\n${indent}  ${onTap},\n${indent}  child: AppCard.lavender(\n${indent}    child: Text('${label}', style: AppTextStyles.title),\n${indent}  ),\n${indent})`;
    }
    return `${indent}AppCard(child: Text('${label}', style: AppTextStyles.title))`;
  }

  if (type === 'component.orderCard') {
    return `${indent}OrderCard(\n${indent}  vehicleName: 'تويوتا كورولا ٢٠٢٤',\n${indent}  date: 'أرسل في 10 يونيو 2024',\n${indent})`;
  }

  if (type === 'component.bottomNav') {
    const items = props.items || [];
    const itemsStr = items.map((item: any, i: number) => {
      const iconMap: Record<string, string> = { home: 'Icons.home_outlined', settings: 'Icons.settings_outlined', chat: 'Icons.chat_outlined', profile: 'Icons.person_outlined' };
      const icon = iconMap[item.icon || ''] || 'Icons.circle_outlined';
      return `        BottomNavItem(icon: ${icon}, label: '${item.label}')`;
    }).join(',\n');
    const activeIdx = props.activeIndex || 0;
    return `${indent}AppBottomNav(\n${indent}  activeIndex: ${activeIdx},\n${indent}  items: [\n${itemsStr},\n${indent}  ],\n${indent})`;
  }

  if (type === 'component.fixedActionBar') {
    const buttonLabel = props.buttonLabel || 'تأكيد';
    const actionId = comp.primaryAction;
    const action = actions.find(a => a.id === actionId);
    const targetScreenId = action?.target;
    const onPressed = targetScreenId
      ? `() => context.goNamed('${targetScreenId}')`
      : '() {}';
    return `${indent}FixedActionBar(\n${indent}  buttonLabel: '${buttonLabel}',\n${indent}  onPressed: ${onPressed},\n${indent})`;
  }

  if (type === 'component.paymentMethodList') {
    const methods = props.methods || [];
    const methodsWidget = methods.map((m: any) => {
      const isWallet = m.id === 'wallet';
      const borderColor = isWallet ? 'AppColors.primary' : 'AppColors.line';
      const iconWidget = isWallet ? 'const Center(child: Icon(Icons.circle, size: 12, color: AppColors.primary))' : 'null';
      const label = m.label || '';
      const hasBalance = !!m.balance;
      const balance = m.balance || '';
      const badgeLine = hasBalance
        ? `\n                  const SizedBox(width: 8),\n                  StatusBadge.purple('${balance}'),`
        : '';
      return `${indent}        Container(
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.sm),
                border: Border.all(color: AppColors.line),
              ),
              child: Row(
                children: [
                  Container(
                    width: 20, height: 20,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: ${borderColor}, width: 2),
                    ),
                    child: ${iconWidget},
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Text('${label}', style: AppTextStyles.bodyRegular, textAlign: TextAlign.right)),
                  ${badgeLine}
                ],
              ),
            )`;
    }).join(',\n');
    return `${indent}Column(\n${indent}  crossAxisAlignment: CrossAxisAlignment.end,\n${indent}  children: [\n${indent}    Text('${props.label || ''}', style: AppTextStyles.label),\n${indent}    const SizedBox(height: 8),\n${methodsWidget},\n${indent}  ],\n${indent})`;
  }

  if (type === 'field.text') {
    return `${indent}AppTextField(label: '${props.label || ''}', placeholder: '${props.placeholder || ''}')`;
  }

  if (type === 'field.phone') {
    return `${indent}AppPhoneField(label: '${props.label || ''}', placeholder: '${props.placeholder || ''}')`;
  }

  // Fallback
  if (flutterWidget === 'UnsupportedSpecWidget') {
    return `${indent}Text('[Unsupported: ${type}]', style: TextStyle(color: Colors.red, fontSize: 12))`;
  }

  return `${indent}// ${type} → ${flutterWidget} (generation not implemented)`;
}

function generateScreenFile(screen: ScreenManifest): string {
  const uiSpec = loadJson(screen.specs.ui.replace('specs/', '')) as UiSpec;
  const productSpec = loadJson(screen.specs.product.replace('specs/', '')) as ProductSpec;
  if (!uiSpec) return '';

  const actions: ActionDef[] = productSpec?.actions || [];
  const layout = uiSpec.layout;
  const regions = layout.regions || {};
  const className = screen.generatedClass;
  const screenId = screen.screenId;

  // Generate header
  const header = regions.header ? generateComponent(regions.header, '        ', actions) : '';

  // Generate body
  const body = regions.body ? generateComponent(regions.body, '        ', actions) : '';

  // Generate footer
  const footer = regions.footer ? generateComponent(regions.footer, '        ', actions) : '';

  const filePath = screen.specs.ui;
  const productPath = screen.specs.product;

  return `// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: ${filePath}
// Product spec: ${productPath}
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../design_system/design_system.dart';

class ${className} extends StatelessWidget {
  const ${className}({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header: ${header ? `\n        ${header}` : 'null'},
      body: ${body ? `\n        ${body}` : 'null'},
      footer: ${footer ? `\n        ${footer}` : 'null'},
      scroll: ${layout.scroll ?? true},
    );
  }
}
`;
}

function main() {
  const screenFlag = process.argv.indexOf('--screen');
  let targetScreenId: string | null = null;
  if (screenFlag !== -1 && process.argv.length > screenFlag + 1) {
    targetScreenId = process.argv[screenFlag + 1];
  }

  specDir = 'specs';

  const manifestPath = path.resolve(process.cwd(), 'specs', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Load component map
  const componentMapPath = path.resolve(process.cwd(), 'specs', 'bindings/flutter/component-map.json');
  if (fs.existsSync(componentMapPath)) {
    const cm = JSON.parse(fs.readFileSync(componentMapPath, 'utf-8'));
    componentMap = cm.componentMap || {};
  } else {
    console.error(`Component map not found: ${componentMapPath}`);
  }

  // Load product specs for action resolution
  const productSpecs: Map<string, ProductSpec> = new Map();
  for (const screen of manifest.screens) {
    if (screen.specs?.product) {
      const p = loadJson(screen.specs.product.replace('specs/', ''));
      if (p) productSpecs.set(screen.screenId, p);
    }
  }

  function loadJson(relativePath: string): any {
    const fullPath = path.resolve(process.cwd(), 'specs', relativePath);
    if (!fs.existsSync(fullPath)) return null;
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  }

  let screensToGenerate = manifest.screens;
  if (targetScreenId) {
    screensToGenerate = manifest.screens.filter(s => s.screenId === targetScreenId);
    if (screensToGenerate.length === 0) {
      console.error(`Screen "${targetScreenId}" not found in manifest`);
      process.exit(1);
    }
  }

  const outputDir = path.join('lib', 'generated', 'screens');
  fs.mkdirSync(outputDir, { recursive: true });

  let generatedCount = 0;
  for (const screen of screensToGenerate) {
    const content = generateScreenFile(screen);
    if (!content) {
      console.log(`⚠️  Skipped ${screen.screenId}: no UI spec`);
      continue;
    }

    const fileName = `${toSnakeCase(screen.screenId)}_screen.dart`;
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`✅ Generated: ${outputPath}`);
    generatedCount++;
  }

  console.log(`\n📱 Generated ${generatedCount} screens (mode: ${mode})`);
}

main();
