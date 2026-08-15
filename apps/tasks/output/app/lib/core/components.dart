// [generated] generator=ComponentRegistryGenerator template=components.v1 class=structural ownership=generated
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
/// Surface (composition registry `CompositionSpec.surface`): card = elevated Card row,
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
