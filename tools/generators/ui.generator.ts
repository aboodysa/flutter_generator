import * as fs from 'fs';
import * as path from 'path';
import {
  GenerationContext,
  Generator,
  ProductAction,
  ProductSpec,
  ScreenSpec,
  UiComponent,
  UiSpec,
} from '../core/types';
import {
  dartString,
  dartStringList,
  renderActionDispatch,
  resolveSpacing,
  specMenuItems,
} from './ui_helpers';

function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

function mapComponentType(type: string, componentMap: Record<string, string>): string {
  const mapped = componentMap[type];
  if (!mapped) {
    throw new Error(`Unsupported component type: "${type}". No binding found in component-map.json`);
  }
  return mapped;
}

function generateComponent(
  comp: UiComponent,
  indent: string,
  actions: ProductAction[] = [],
  screenId = '',
  componentMap: Record<string, string> = {},
): string {
  const type = comp.type;
  const flutterWidget = mapComponentType(type, componentMap);
  const props = comp.props || {};

  if (type === 'screen') return '';

  if (type === 'layout.vertical') {
    const spacing = resolveSpacing(comp.spacing);
    const children = (comp.children || [])
      .map(c => generateComponent(c, indent + '          ', actions, screenId, componentMap))
      .join(',\n');
    return `${indent}Column(\n${indent}  spacing: ${spacing},\n${indent}  crossAxisAlignment: CrossAxisAlignment.stretch,\n${indent}  children: [\n${children}\n${indent}  ],\n${indent})`;
  }

  if (type === 'layout.horizontal') {
    const spacing = resolveSpacing(comp.spacing);
    const isScroll = comp.scroll === 'horizontal';
    const children = (comp.children || [])
      .map(c => generateComponent(c, indent + '          ', actions, screenId, componentMap))
      .join(',\n');
    const expandedChildren = (comp.children || [])
      .map(c => {
        const child = generateComponent(c, indent + '      ', actions, screenId, componentMap);
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
    const children = (comp.children || [])
      .map(c => generateComponent(c, indent + '          ', actions, screenId, componentMap))
      .join(',\n');
    return `${indent}GridView.count(\n${indent}  crossAxisCount: ${columns},\n${indent}  mainAxisSpacing: ${spacing},\n${indent}  crossAxisSpacing: ${spacing},\n${indent}  shrinkWrap: true,\n${indent}  physics: const NeverScrollableScrollPhysics(),\n${indent}  childAspectRatio: 2.8,\n${indent}  children: [\n${children}\n${indent}  ],\n${indent})`;
  }

  if (type === 'layout.list') {
    const items = props.children || props.items || [];
    const itemWidgets = specMenuItems(items, `${indent}    `);
    return `${indent}SpecList(\n${indent}  title: ${dartString(props.title || '')},\n${indent}  items: [\n${itemWidgets}\n${indent}  ],\n${indent})`;
  }

  if (type === 'action.primary') {
    const label = props.label || props.buttonLabel || 'تأكيد';
    const actionId = comp.action || comp.primaryAction;
    const action = actions.find(a => a.id === actionId);
    const targetScreenId = action?.target;
    const onPressed = actionId
      ? renderActionDispatch(screenId, actionId, targetScreenId)
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

  if (type === 'component.appHeader') {
    const variant = props.variant || comp.variant || 'default';
    const title = props.title || '';

    if (variant === 'splash') {
      return `${indent}const SplashHero()`;
    }

    if (variant === 'title-only') {
      return `${indent}Text('${title}', style: AppTextStyles.heading, textAlign: TextAlign.start)`;
    }

    if (variant === 'subtitle') {
      return `${indent}Text('${title}', style: AppTextStyles.bodyRegular.copyWith(color: AppColors.textMuted, height: 1.5), textAlign: TextAlign.start)`;
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
    const onTap = actionId
      ? `onTap: ${renderActionDispatch(screenId, actionId, targetScreenId)}`
      : '';

    if (variant === 'peach') {
      if (!actionId) {
        return `${indent}AppCard.peach(\n${indent}  child: Text('${label}', style: AppTextStyles.title),\n${indent})`;
      }
      return `${indent}GestureDetector(\n${indent}  ${onTap},\n${indent}  child: AppCard.peach(\n${indent}    child: Text('${label}', style: AppTextStyles.title),\n${indent}  ),\n${indent})`;
    }
    if (variant === 'lavender') {
      if (!actionId) {
        return `${indent}AppCard.lavender(\n${indent}  child: Text('${label}', style: AppTextStyles.title),\n${indent})`;
      }
      return `${indent}GestureDetector(\n${indent}  ${onTap},\n${indent}  child: AppCard.lavender(\n${indent}    child: Text('${label}', style: AppTextStyles.title),\n${indent}  ),\n${indent})`;
    }
    if (subtitle) {
      return `${indent}AppCard(\n${indent}  child: Column(\n${indent}    crossAxisAlignment: CrossAxisAlignment.stretch,\n${indent}    children: [\n${indent}      Align(\n${indent}        alignment: AlignmentDirectional.centerStart,\n${indent}        child: Text(${dartString(label)}, style: AppTextStyles.title, textAlign: TextAlign.start),\n${indent}      ),\n${indent}      const SizedBox(height: AppSpacing.xs),\n${indent}      Align(\n${indent}        alignment: AlignmentDirectional.centerStart,\n${indent}        child: Text(${dartString(subtitle)}, style: AppTextStyles.caption, textAlign: TextAlign.start),\n${indent}      ),\n${indent}    ],\n${indent}  ),\n${indent})`;
    }
    return `${indent}AppCard(child: Align(alignment: AlignmentDirectional.centerStart, child: Text(${dartString(label)}, style: AppTextStyles.title, textAlign: TextAlign.start)))`;
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
    const children = (comp.children || []).map(c => generateComponent(c, indent + '    ', actions, screenId, componentMap)).join(',\n');
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
    const itemsStr = items
      .map((item: any) => {
        const iconMap: Record<string, string> = {
          home: 'Icons.home_outlined',
          settings: 'Icons.settings_outlined',
          chat: 'Icons.chat_outlined',
          profile: 'Icons.person_outlined',
        };
        const icon = iconMap[item.icon || ''] || 'Icons.circle_outlined';
        return `        BottomNavItem(icon: ${icon}, label: '${item.label}')`;
      })
      .join(',\n');
    const activeIdx = props.activeIndex || 0;
    return `${indent}AppBottomNav(\n${indent}  activeIndex: ${activeIdx},\n${indent}  items: [\n${itemsStr},\n${indent}  ],\n${indent})`;
  }

  if (type === 'component.fixedActionBar') {
    const buttonLabel = props.buttonLabel || 'تأكيد';
    const actionId = comp.primaryAction;
    const action = actions.find(a => a.id === actionId);
    const targetScreenId = action?.target;
    const onPressed = actionId
      ? renderActionDispatch(screenId, actionId, targetScreenId)
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

  if (flutterWidget === 'UnsupportedSpecWidget') {
    return `${indent}Text('[Unsupported: ${type}]', style: TextStyle(color: Colors.red, fontSize: 12))`;
  }

  return `${indent}// ${type} → ${flutterWidget} (generation not implemented)`;
}

function generateScreenFile(
  screen: ScreenSpec,
  uiSpec: UiSpec,
  productSpec: ProductSpec | undefined,
  componentMap: Record<string, string>,
): string {
  if (!uiSpec) return '';

  const actions = productSpec?.actions || [];
  const layout = uiSpec.layout;
  const regions = layout.regions || {};
  const className = screen.generatedClass;
  const screenId = screen.screenId;

  const header = regions.header ? generateComponent(regions.header, '        ', actions, screenId, componentMap) : '';
  const body = regions.body ? generateComponent(regions.body, '        ', actions, screenId, componentMap) : '';
  const footer = regions.footer ? generateComponent(regions.footer, '        ', actions, screenId, componentMap) : '';
  const usesActionDispatcher = [header, body, footer].some(part => part.includes('AppActionDispatcher.dispatch'));
  const actionDispatcherImport = usesActionDispatcher ? "import '../../app/app_action_dispatcher.dart';\n" : '';

  const filePath = screen.specs.ui;
  const productPath = screen.specs.product;
  const renderRegion = (name: string, rendered: string) =>
    rendered ? `      ${name}:\n${rendered}` : `      ${name}: null`;

  return `// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: ${filePath}
// Product spec: ${productPath}
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
${actionDispatcherImport}import '../../design_system/design_system.dart';

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

export class UIGenerator implements Generator {
  readonly name = 'ui';

  async generate(context: GenerationContext): Promise<void> {
    const outputDir = path.join(context.outputRoot, 'generated', 'screens');
    fs.mkdirSync(outputDir, { recursive: true });

    let generatedCount = 0;
    for (const screen of context.screens) {
      const uiSpec = context.uiSpecsByScreenId[screen.screenId];
      const productSpec = context.productSpecsByScreenId[screen.screenId];
      if (!uiSpec) {
        console.log(`⚠️  Skipped ${screen.screenId}: no UI spec`);
        continue;
      }

      const content = generateScreenFile(screen, uiSpec, productSpec, context.componentMap);
      const fileName = `${toSnakeCase(screen.screenId)}_screen.dart`;
      const outputPath = path.join(outputDir, fileName);
      fs.writeFileSync(outputPath, content, 'utf-8');
      console.log(`✅ Generated: ${outputPath}`);
      generatedCount++;
    }

    console.log(`\n📱 Generated ${generatedCount} screens`);
  }
}
