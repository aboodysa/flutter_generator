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

function dartString(value: any): string {
  return `'${String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

function dartStringList(values: any[] = []): string {
  return `[${values.map(value => dartString(value)).join(', ')}]`;
}

function specMenuItems(items: any[] = [], indent: string): string {
  return items
    .map(item => {
      const fields = [`label: ${dartString(item.label || item.title || '')}`];
      if (item.icon) fields.push(`icon: ${dartString(item.icon)}`);
      if (item.subtitle) fields.push(`subtitle: ${dartString(item.subtitle)}`);
      return `${indent}SpecMenuItem(${fields.join(', ')})`;
    })
    .join(',\n');
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
    const expandedChildren = (comp.children || [])
      .map(c => {
        const child = generateComponent(c, indent + '      ', actions);
        return `${indent}    Expanded(\n${indent}      child:\n${child},\n${indent}    )`;
      })
      .join(',\n');

    if (props.title) {
      const trailingLabel = props.trailingLabel ? `${indent}    Text('${props.trailingLabel}', style: AppTextStyles.caption),\n` : '';
      const headerWithTrailing = `${indent}Row(\n${indent}  mainAxisAlignment: MainAxisAlignment.spaceBetween,\n${indent}  children: [\n${indent}    Text('${props.title}', style: AppTextStyles.title),\n${trailingLabel}${indent}  ],\n${indent})`;
      const isList = props.display === 'list' || props.layout === 'list';
      if (isList) {
        return `${indent}Column(\n${indent}  crossAxisAlignment: CrossAxisAlignment.stretch,\n${indent}  children: [\n${headerWithTrailing},\n${children}\n${indent}  ],\n${indent})`;
      }

      return `${indent}Column(\n${indent}  crossAxisAlignment: CrossAxisAlignment.stretch,\n${indent}  children: [\n${headerWithTrailing},\n${indent}    Row(\n${indent}      spacing: ${spacing},\n${indent}      children: [\n${children}\n${indent}      ],\n${indent}    )\n${indent}  ],\n${indent})`;
    }

    if (isScroll) {
      return `${indent}SingleChildScrollView(\n${indent}  scrollDirection: Axis.horizontal,\n${indent}  child: Row(\n${indent}    spacing: ${spacing},\n${indent}    children: [\n${children}\n${indent}    ],\n${indent}  ),\n${indent})`;
    }
    return `${indent}Row(\n${indent}  spacing: ${spacing},\n${indent}  children: [\n${expandedChildren}\n${indent}  ],\n${indent})`;
  }

  if (type === 'layout.grid') {
    const spacing = resolveSpacing(comp.spacing);
    const columns = Number((comp as any).columns || props.columns || 2);
    const children = (comp.children || []).map(c => generateComponent(c, indent + '          ', actions)).join(',\n');
    return `${indent}GridView.count(\n${indent}  crossAxisCount: ${columns},\n${indent}  mainAxisSpacing: ${spacing},\n${indent}  crossAxisSpacing: ${spacing},\n${indent}  shrinkWrap: true,\n${indent}  physics: const NeverScrollableScrollPhysics(),\n${indent}  childAspectRatio: 2.8,\n${indent}  children: [\n${children}\n${indent}  ],\n${indent})`;
  }

  if (type === 'layout.list') {
    const items = props.children || props.items || [];
    const itemWidgets = specMenuItems(items, `${indent}    `);
    return `${indent}SpecList(\n${indent}  title: ${dartString(props.title || '')},\n${indent}  items: [\n${itemWidgets}\n${indent}  ],\n${indent})`;
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
    const variant = props.variant || comp.variant || 'default';
    const title = props.title || '';

    if (variant === 'splash') {
      return `${indent}const SplashHero()`;
    }

    if (variant === 'title-only') {
      return `${indent}Text('${title}', style: AppTextStyles.heading, textAlign: TextAlign.right)`;
    }

    if (variant === 'subtitle') {
      return `${indent}Text('${title}', style: AppTextStyles.bodyRegular.copyWith(color: AppColors.textMuted, height: 1.5), textAlign: TextAlign.right)`;
    }

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
    const label = props.label || props.title || props.name || '';
    const subtitle = props.subtitle || props.phone || props.description || '';
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
    if (subtitle) {
      return `${indent}AppCard(\n${indent}  child: Column(\n${indent}    crossAxisAlignment: CrossAxisAlignment.end,\n${indent}    children: [\n${indent}      Text(${dartString(label)}, style: AppTextStyles.title, textAlign: TextAlign.right),\n${indent}      const SizedBox(height: AppSpacing.xs),\n${indent}      Text(${dartString(subtitle)}, style: AppTextStyles.caption, textAlign: TextAlign.right),\n${indent}    ],\n${indent}  ),\n${indent})`;
    }
    return `${indent}AppCard(child: Text(${dartString(label)}, style: AppTextStyles.title, textAlign: TextAlign.right))`;
  }

  if (type === 'component.serviceCard') {
    return `${indent}ServiceCard(title: ${dartString(props.title || props.name || '')}, subtitle: ${dartString(props.subtitle || props.address || '')}, price: ${dartString(props.price || '')})`;
  }

  if (type === 'component.vehicleCard') {
    return `${indent}VehicleCard(title: ${dartString(props.title || props.name || props.vehicleName || '')}, subtitle: ${dartString(props.subtitle || props.model || '')}, plate: ${dartString(props.plate || props.plateNumber || '')}, status: ${dartString(props.status || '')})`;
  }

  if (type === 'component.walletCard') {
    return `${indent}WalletCard(title: ${dartString(props.title || 'المحفظة')}, balance: ${dartString(props.balance || props.amount || '0 ر.س')})`;
  }

  if (type === 'component.statusBadge') {
    return `${indent}StatusBadge.purple(${dartString(props.label || props.status || '')})`;
  }

  if (type === 'component.bottomSheet') {
    const children = (comp.children || []).map(c => generateComponent(c, indent + '    ', actions)).join(',\n');
    return `${indent}AppBottomSheet(\n${indent}  children: [\n${children}\n${indent}  ],\n${indent})`;
  }

  if (type === 'component.timeline') {
    const steps = (props.steps || [])
      .map((step: any) => `${indent}    TimelineStepData(label: ${dartString(step.label || '')}, completed: ${step.completed === true})`)
      .join(',\n');
    return `${indent}InspectionTimeline(\n${indent}  steps: [\n${steps}\n${indent}  ],\n${indent})`;
  }

  if (type === 'component.photoGrid') {
    return `${indent}PhotoGrid(label: ${dartString(props.label || '')}, count: ${Number(props.count || 4)})`;
  }

  if (type === 'component.profileMenu') {
    const items = specMenuItems(props.items || [], `${indent}    `);
    return `${indent}ProfileMenu(\n${indent}  title: ${dartString(props.title || '')},\n${indent}  items: [\n${items}\n${indent}  ],\n${indent})`;
  }

  if (type === 'component.plate') {
    return `${indent}VehiclePlate(label: ${dartString(props.label || '')}, placeholder: ${dartString(props.placeholder || '')}, value: ${dartString(props.value || '')})`;
  }

  if (type === 'component.searchField') {
    return `${indent}AppSearchField(placeholder: ${dartString(props.placeholder || '')})`;
  }

  if (type === 'component.segmentedControl') {
    const items = props.items || props.segments || [];
    return `${indent}AppSegmentedControl(items: ${dartStringList(items.map((item: any) => item.label || item))}, activeIndex: ${Number(props.activeIndex || 0)})`;
  }

  if (type === 'component.chipGroup') {
    const items = props.items || props.chips || [];
    return `${indent}AppChipGroup(items: ${dartStringList(items.map((item: any) => item.label || item))}, activeIndex: ${Number(props.activeIndex || 0)})`;
  }

  if (type === 'component.orderCard') {
    const card = `${indent}OrderCard(\n${indent}  vehicleName: '${props.vehicleName || ''}',\n${indent}  date: '${props.date || ''}',\n${indent})`;
    const repeatCount = typeof props.repeatCount === 'number' ? props.repeatCount : 1;
    if (repeatCount > 1) {
      const repeatedCards = Array.from({ length: repeatCount }).map(() => card).join(`,\n${indent}    const SizedBox(height: AppSpacing.sm),\n`);
      return `${indent}Column(\n${indent}  crossAxisAlignment: CrossAxisAlignment.stretch,\n${indent}  children: [\n${repeatedCards}\n${indent}  ],\n${indent})`;
    }
    return card;
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
    const methodsWidget = methods
      .map((m: any) => {
        const parts = [
          `id: '${m.id || ''}'`,
          `label: '${m.label || ''}'`,
        ];
        if (m.icon) parts.push(`icon: '${m.icon}'`);
        if (m.balance) parts.push(`balance: '${m.balance}'`);
        if (m.selected === true) parts.push('selected: true');
        return `${indent}    PaymentMethodOption(${parts.join(', ')})`;
      })
      .join(',\n');
    const selectedId = props.selectedId ? `,\n${indent}  selectedId: '${props.selectedId}'` : '';
    return `${indent}PaymentMethodList(\n${indent}  label: '${props.label || ''}',\n${indent}  methods: [\n${methodsWidget}\n${indent}  ]${selectedId},\n${indent})`;
  }

  if (type === 'field.text') {
    const suffix = props.trailingLabel
      ? `,\n${indent}  suffix: Text('${props.trailingLabel}', style: AppTextStyles.label.copyWith(color: AppColors.primary))`
      : '';
    const prefix = props.trailingLabel
      ? `,\n${indent}  prefix: const Icon(Icons.local_offer_outlined, size: 16, color: AppColors.textMuted)`
      : '';
    return `${indent}AppTextField(label: ${dartString(props.label || '')}, placeholder: ${dartString(props.placeholder || '')}${prefix}${suffix})`;
  }

  if (type === 'field.phone') {
    return `${indent}AppPhoneField(label: ${dartString(props.label || '')}, placeholder: ${dartString(props.placeholder || '')})`;
  }

  if (type === 'field.otp') {
    return `${indent}OtpInput(length: ${Number(props.length || 4)})`;
  }

  if (type === 'field.select') {
    return `${indent}AppSelectField(label: ${dartString(props.label || '')}, placeholder: ${dartString(props.placeholder || '')}, options: ${dartStringList(props.options || [])})`;
  }

  if (type === 'field.amount') {
    return `${indent}AmountField(label: ${dartString(props.label || '')}, placeholder: ${dartString(props.placeholder || '')}, currency: ${dartString(props.currency || 'ر.س')})`;
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
  const usesGoRouter = [header, body, footer].some(part => part.includes('context.goNamed'));
  const routerImport = usesGoRouter ? "import 'package:go_router/go_router.dart';\n" : '';

  const filePath = screen.specs.ui;
  const productPath = screen.specs.product;
  const renderRegion = (name: string, rendered: string) =>
    rendered ? `      ${name}:\n${rendered}` : `      ${name}: null`;

  return `// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: ${filePath}
// Product spec: ${productPath}
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
${routerImport}import '../../design_system/design_system.dart';

class ${className} extends StatelessWidget {
  const ${className}({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
${renderRegion('header', header)},
${renderRegion('body', body)},
${renderRegion('footer', footer)},
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
