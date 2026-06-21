import 'package:flutter/material.dart';
import '../core/theme/theme.dart';

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? color;
  final double? height;
  final VoidCallback? onTap;

  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.md),
    this.color,
    this.height,
    this.onTap,
  });

  factory AppCard.peach({required Widget child, VoidCallback? onTap}) {
    return AppCard(color: AppColors.peach, child: child, onTap: onTap);
  }

  factory AppCard.lavender({required Widget child, VoidCallback? onTap}) {
    return AppCard(color: AppColors.lavender, child: child, onTap: onTap);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        height: height,
        padding: padding,
        decoration: BoxDecoration(
          color: color ?? AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.line),
        ),
        child: child,
      ),
    );
  }
}
