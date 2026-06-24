import { ProductAction } from '../core/types';

export function dartString(value: any): string {
  return `'${String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

export function dartStringList(values: any[] = []): string {
  return `[${values.map(value => dartString(value)).join(', ')}]`;
}

export function resolveSpacing(spacing?: string): string {
  const map: Record<string, string> = {
    xs: 'AppSpacing.xs',
    sm: 'AppSpacing.sm',
    md: 'AppSpacing.md',
    lg: 'AppSpacing.lg',
    xl: 'AppSpacing.xl',
    xxl: 'AppSpacing.xxl',
  };
  return spacing ? map[spacing] || 'AppSpacing.md' : 'AppSpacing.md';
}

export function specMenuItems(items: any[] = [], indent: string): string {
  return items
    .map(item => {
      const fields = [`label: ${dartString(item.label || item.title || '')}`];
      if (item.icon) fields.push(`icon: ${dartString(item.icon)}`);
      if (item.subtitle) fields.push(`subtitle: ${dartString(item.subtitle)}`);
      return `${indent}SpecMenuItem(${fields.join(', ')})`;
    })
    .join(',\n');
}

export function renderActionDispatch(
  screenId: string,
  actionId: string,
  fallbackRouteName?: string | null,
): string {
  const lines = [
    '() => AppActionDispatcher.dispatch(',
    '    context,',
    `    screenId: ${dartString(screenId)},`,
    `    actionId: ${dartString(actionId)},`,
  ];
  if (fallbackRouteName && fallbackRouteName.trim().length > 0) {
    lines.push(`    fallbackRouteName: ${dartString(fallbackRouteName)},`);
  }
  lines.push('  )');
  return lines.join('\n');
}

export function actionTarget(action: ProductAction | undefined): string | undefined {
  return action?.target;
}
