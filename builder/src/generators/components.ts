import { FeatureModel } from "../types";

/**
 * ComponentRegistryGenerator — structural, deterministic, 0% LLM.
 * Emits a small reusable design-system (tokens → atoms) that screens consume (§8).
 * Screens reference these by semantic contract, never hardcode tokens.
 */
export function generateComponents(_f: FeatureModel): string {
  return `// [generated] generator=ComponentRegistryGenerator template=components.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';

abstract final class AppTokens {
  static const spacing = 16.0;
  static const radius = 12.0;
}

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

class LoadingState extends StatelessWidget {
  const LoadingState({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: CircularProgressIndicator());
}

class ErrorState extends StatelessWidget {
  const ErrorState({super.key, this.message});
  final String? message;
  @override
  Widget build(BuildContext context) => Center(child: Text(message ?? 'Something went wrong'));
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, this.message});
  final String? message;
  @override
  Widget build(BuildContext context) => Center(child: Text(message ?? 'No items'));
}
`;
}
