import { FeatureModel } from "../types";
import { hasLocale } from "../operations";

/**
 * Component registry (§8) — Tokens → Foundations → Atoms → Molecules → Organisms → Templates → Pages.
 * Each component exposes {name, purpose, inputs, variants, states, tokens, semanticContract, responsive, examples}.
 * This catalog is the single source of truth; generated screens select components by semantic
 * requirement and must never bypass it (enforced by the arch-linter, which forbids raw tokens).
 */

export type ComponentTier = "token" | "foundation" | "atom" | "molecule" | "organism" | "template" | "page";

export interface SemanticContract {
  role: string; // button | link | heading | input | image | status | ...
  accessibleName?: string; // {source} or fallback
  states: string[]; // enabled, disabled, selected, loading, error, ...
  keyboardFocusable?: boolean;
  mergePolicy: "merge" | "excludeSemantics";
}

export interface ComponentDef {
  name: string;
  tier: ComponentTier;
  purpose: string;
  inputs: string[];
  variants: string[];
  states: string[];
  tokens: string[];
  semanticContract: SemanticContract;
  responsive: boolean;
  examples: string[];
}

export const COMPONENT_REGISTRY: ComponentDef[] = [
  {
    name: "AppTokens",
    tier: "token",
    purpose: "Design tokens: spacing, radius, color palette.",
    inputs: [],
    variants: [],
    states: [],
    tokens: [],
    semanticContract: { role: "none", states: [], mergePolicy: "excludeSemantics" },
    responsive: false,
    examples: ["AppTokens.spacing", "AppTokens.primary"],
  },
  {
    name: "PrimaryButton",
    tier: "atom",
    purpose: "Primary action button.",
    inputs: ["label", "onPressed", "semanticLabel?"],
    variants: ["enabled", "disabled"],
    states: ["enabled", "disabled"],
    tokens: ["AppTokens.spacing", "AppTokens.radius", "AppTokens.primary"],
    semanticContract: { role: "button", accessibleName: "{source: semanticLabel | label}", states: ["enabled", "disabled"], keyboardFocusable: true, mergePolicy: "excludeSemantics" },
    responsive: false,
    examples: ["PrimaryButton(label: 'Save', onPressed: _save)"],
  },
  {
    name: "LoadingState",
    tier: "molecule",
    purpose: "Loading placeholder shown while a list/detail is fetching.",
    inputs: [],
    variants: [],
    states: ["loading"],
    tokens: [],
    semanticContract: { role: "progressbar", accessibleName: "Loading", states: ["loading"], mergePolicy: "excludeSemantics" },
    responsive: false,
    examples: ["const LoadingState()"],
  },
  {
    name: "ErrorState",
    tier: "molecule",
    purpose: "Error placeholder with an optional message.",
    inputs: ["message?"],
    variants: [],
    states: ["error"],
    tokens: ["AppTokens.spacing"],
    semanticContract: { role: "alert", accessibleName: "{source: message}", states: ["error"], mergePolicy: "merge" },
    responsive: false,
    examples: ["ErrorState(message: state.errorMessage)"],
  },
  {
    name: "EmptyState",
    tier: "molecule",
    purpose: "Empty-list placeholder.",
    inputs: ["message?"],
    variants: [],
    states: ["empty"],
    tokens: ["AppTokens.spacing"],
    semanticContract: { role: "text", accessibleName: "{source: message}", states: ["empty"], mergePolicy: "merge" },
    responsive: false,
    examples: ["const EmptyState()"],
  },
  {
    name: "AppAvatar",
    tier: "atom",
    purpose: "Leading avatar rendering the first-letter initial of a label (list-row identity glyph).",
    inputs: ["label"],
    variants: [],
    states: [],
    tokens: [],
    semanticContract: { role: "image", accessibleName: "{source: label}", states: [], mergePolicy: "merge" },
    responsive: false,
    examples: ["AppAvatar(label: item.name)"],
  },
  {
    name: "AppListCard",
    tier: "molecule",
    purpose: "A list/detail row (leading/title/subtitle/trailing/onTap) with a switchable surface — "
      + "Card-wrapped or a plain ListTile — driven by the composition registry's `surface` field "
      + "(§8: the vocabulary ScreenGenerator selects from instead of hardcoding raw Card/ListTile).",
    inputs: ["title", "subtitle?", "leading?", "trailing?", "onTap?", "card"],
    variants: ["card", "plain"],
    states: ["enabled"],
    tokens: ["AppTokens.radius"],
    semanticContract: { role: "none", states: [], mergePolicy: "merge" },
    responsive: false,
    examples: ["AppListCard(card: true, title: Text(item.name), trailing: const Icon(Icons.chevron_right))"],
  },
  {
    name: "AppChip",
    tier: "atom",
    purpose: "UIX Slice C: a small colored label for a role-inferred status/priority enum value — "
      + "replaces a bare Text(value.name) with a tone-colored pill so state is scannable at a glance.",
    inputs: ["label", "tone"],
    variants: ["neutral", "info", "warning", "danger", "success"],
    states: [],
    tokens: ["AppColors.info", "AppColors.warning", "AppColors.danger", "AppColors.success", "AppSpacing.sm", "AppRadius.control"],
    semanticContract: { role: "text", accessibleName: "{source: label}", states: [], mergePolicy: "merge" },
    responsive: false,
    examples: ["AppChip(label: item.status.name, tone: AppChip.toneForStatus(item.status.name))"],
  },
  {
    name: "AppStatusDot",
    tier: "atom",
    purpose: "UIX Slice C: a small tone-colored dot — replaces the generic initial-letter AppAvatar "
      + "as a list row's leading glyph when the entity has a status/priority field (a color-coded "
      + "state is more meaningful than an arbitrary initial).",
    inputs: ["tone", "semanticLabel?"],
    variants: ["neutral", "info", "warning", "danger", "success"],
    states: [],
    tokens: ["AppColors.info", "AppColors.warning", "AppColors.danger", "AppColors.success"],
    semanticContract: { role: "image", accessibleName: "{source: semanticLabel}", states: [], mergePolicy: "merge" },
    responsive: false,
    examples: ["AppStatusDot(tone: AppChip.toneForStatus(item.status.name), semanticLabel: item.status.name)"],
  },
  {
    name: "AppScrollBehavior",
    tier: "token",
    purpose: "RCA-006: Flutter's default ScrollBehavior excludes mouse from dragDevices (desktop/"
      + "web mouse-drag is reserved for text selection) — every generated list opts into touch + "
      + "mouse + trackpad + stylus drag-to-scroll so it's consistent across input devices, not just "
      + "the touch-only default.",
    inputs: [],
    variants: [],
    states: [],
    tokens: [],
    semanticContract: { role: "none", states: [], mergePolicy: "excludeSemantics" },
    responsive: false,
    examples: ["ScrollConfiguration(behavior: const AppScrollBehavior(), child: ListView(...))"],
  },
];

/**
 * ComponentRegistryGenerator — structural, deterministic, 0% LLM.
 * Emits the design system (tokens → atoms → molecules) from the registry above.
 * Screens reference these by semantic contract; they never hardcode tokens.
 */
export function generateComponents(f: FeatureModel): string {
  // L4: ErrorState's fallback message goes through AppStrings when the app is locale-aware —
  // same widget structure either way, just a different string source. LoadingState stays
  // spinner-only (its `loading` string isn't shown anywhere today, locale-aware or not — adding
  // new visible text there is a UI change beyond this slice's "swap strings" scope).
  const locale = hasLocale(f);
  const errorFallback = locale ? "AppStrings.of(context).error" : "'Something went wrong'";
  // Leading "\n" folded into the value itself (not a separate always-present template line) so a
  // non-locale app's import block gains zero extra blank lines — same byte-identical-when-unused
  // guarantee every other conditional-import hook (MF5's budgetImport, L3's exportImport) keeps.
  const l10nImport = locale ? "\nimport 'app_strings.dart';" : "";
  return `// [generated] generator=ComponentRegistryGenerator template=components.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
// Component registry (DESIGN §8): Tokens → Atoms → Molecules.
import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'theme.dart';${l10nImport}

abstract final class AppTokens {
  static const spacing = 16.0;
  static const radius = 12.0;
  static const Color primary = Color(0xFF006E6A);
}

/// semanticContract: { role: button, accessibleName: {source: semanticLabel | label}, states: [enabled, disabled], keyboardFocusable: true }
class PrimaryButton extends StatelessWidget {
  const PrimaryButton({super.key, required this.label, required this.onPressed, this.semanticLabel});
  final String label;
  final VoidCallback? onPressed;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: semanticLabel ?? label,
      child: FilledButton(onPressed: onPressed, child: Text(label)),
    );
  }
}

/// semanticContract: { role: progressbar, accessibleName: "Loading", states: [loading] }
class LoadingState extends StatelessWidget {
  const LoadingState({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: CircularProgressIndicator());
}

/// semanticContract: { role: alert, accessibleName: {source: message}, states: [error] }
class ErrorState extends StatelessWidget {
  const ErrorState({super.key, this.message});
  final String? message;
  @override
  Widget build(BuildContext context) => Center(child: Text(message ?? ${errorFallback}));
}

/// semanticContract: { role: text, accessibleName: {source: message}, states: [empty] }
class EmptyState extends StatelessWidget {
  const EmptyState({super.key, this.message});
  final String? message;
  @override
  Widget build(BuildContext context) => Center(child: Text(message ?? 'No items'));
}

/// semanticContract: { role: image, accessibleName: {source: label}, states: [] }
class AppAvatar extends StatelessWidget {
  const AppAvatar({super.key, required this.label});
  final String label;

  String get _initial => label.isEmpty ? '?' : label[0].toUpperCase();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      child: CircleAvatar(child: Text(_initial)),
    );
  }
}

/// semanticContract: { role: none, states: [] } — semantics come from the child ListTile.
/// Surface (composition registry \`CompositionSpec.surface\`): card = elevated Card row,
/// plain = bare ListTile. ScreenGenerator selects this instead of hardcoding raw Card/ListTile
/// (§8: "generated screens select components by semantic requirement").
class AppListCard extends StatelessWidget {
  const AppListCard({
    super.key,
    required this.card,
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
    this.onTap,
  });
  final bool card;
  final Widget title;
  final Widget? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final tile = ListTile(
      leading: leading,
      title: title,
      subtitle: subtitle,
      trailing: trailing,
      onTap: onTap,
    );
    return card ? Card(child: tile) : tile;
  }
}

// UIX Slice C: tone vocabulary shared by AppChip and AppStatusDot — a role-inferred status/
// priority value maps to one of these, never a raw hex color chosen ad hoc per screen.
enum AppChipTone { neutral, info, warning, danger, success }

/// semanticContract: { role: text, accessibleName: {source: label}, states: [] }
class AppChip extends StatelessWidget {
  const AppChip({super.key, required this.label, this.tone = AppChipTone.neutral});
  final String label;
  final AppChipTone tone;

  // Deterministic, vocabulary-based (not per-app config): recognizes the common status/priority
  // words apps actually use ("open", "in progress", "done", "high priority", ...) and falls back
  // to a neutral/info tone for anything unrecognized, so an unfamiliar enum value never crashes —
  // it just renders undecorated instead of mis-colored.
  static AppChipTone toneForStatus(String value) {
    final v = value.toLowerCase();
    if (v.contains('done') || v.contains('closed') || v.contains('approved') || v.contains('complete')) return AppChipTone.success;
    if (v.contains('reject') || v.contains('fail') || v.contains('cancel') || v.contains('block')) return AppChipTone.danger;
    if (v.contains('progress') || v.contains('pending') || v.contains('review')) return AppChipTone.warning;
    return AppChipTone.info;
  }

  static AppChipTone toneForPriority(String value) {
    final v = value.toLowerCase();
    if (v.contains('high') || v.contains('urgent') || v.contains('critical')) return AppChipTone.danger;
    if (v.contains('medium') || v.contains('moderate')) return AppChipTone.warning;
    return AppChipTone.neutral;
  }

  // UIX Slice D: the tone→color mapping is public (not just used by this widget's own build())
  // so ChoiceChip in crud_form.ts/screen.ts can tint its selected state with the SAME color a
  // read-only AppChip/AppStatusDot would show for that value — one mapping, three consumers.
  static Color colorForTone(BuildContext context, AppChipTone tone) => switch (tone) {
    AppChipTone.info => AppColors.info,
    AppChipTone.warning => AppColors.warning,
    AppChipTone.danger => AppColors.danger,
    AppChipTone.success => AppColors.success,
    AppChipTone.neutral => Theme.of(context).colorScheme.outline,
  };

  @override
  Widget build(BuildContext context) {
    final color = AppChip.colorForTone(context, tone);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: const BorderRadius.all(Radius.circular(AppRadius.control)),
      ),
      child: Text(label, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: color)),
    );
  }
}

/// semanticContract: { role: image, accessibleName: {source: semanticLabel}, states: [] }
class AppStatusDot extends StatelessWidget {
  const AppStatusDot({super.key, required this.tone, this.semanticLabel});
  final AppChipTone tone;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: semanticLabel,
      child: Container(
        width: 12,
        height: 12,
        decoration: BoxDecoration(color: AppChip.colorForTone(context, tone), shape: BoxShape.circle),
      ),
    );
  }
}

// RCA-006: the Material default ScrollBehavior only puts touch (and stylus) in dragDevices —
// deliberate, since desktop/web mouse-drag is conventionally reserved for text selection. That
// default is also why a real mouse click-drag never scrolled the generated list in this app's own
// investigation, while a genuine touch-type gesture always did. Every generated list opts into
// this behavior so drag-to-scroll works uniformly across touch, mouse, and trackpad.
class AppScrollBehavior extends MaterialScrollBehavior {
  const AppScrollBehavior();

  @override
  Set<PointerDeviceKind> get dragDevices => {
    PointerDeviceKind.touch,
    PointerDeviceKind.mouse,
    PointerDeviceKind.trackpad,
    PointerDeviceKind.stylus,
  };
}
`;
}
