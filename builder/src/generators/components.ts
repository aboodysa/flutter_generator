import { FeatureModel } from "../types";

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
];

/**
 * ComponentRegistryGenerator — structural, deterministic, 0% LLM.
 * Emits the design system (tokens → atoms → molecules) from the registry above.
 * Screens reference these by semantic contract; they never hardcode tokens.
 */
export function generateComponents(_f: FeatureModel): string {
  return `// [generated] generator=ComponentRegistryGenerator template=components.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
// Component registry (DESIGN §8): Tokens → Atoms → Molecules.
import 'package:flutter/material.dart';

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
  Widget build(BuildContext context) => Center(child: Text(message ?? 'Something went wrong'));
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
`;
}
