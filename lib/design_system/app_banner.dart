import 'package:flutter/material.dart';
import '../core/theme/theme.dart';

class AppBanner extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? icon;
  final Color? color;
  final VoidCallback? onTap;

  const AppBanner({
    super.key,
    required this.title,
    this.subtitle,
    this.icon,
    this.color,
    this.onTap,
  });

  factory AppBanner.peach(
      {required String title,
      String? subtitle,
      Widget? icon,
      VoidCallback? onTap}) {
    return AppBanner(
        title: title,
        subtitle: subtitle,
        icon: icon,
        color: AppColors.peach,
        onTap: onTap);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minWidth: 300),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: color ?? AppColors.cultured,
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(title, style: AppTextStyles.label),
                  if (subtitle != null) ...[
                    const SizedBox(height: 4),
                    Text(subtitle!, style: AppTextStyles.caption),
                  ],
                ],
              ),
            ),
            if (icon != null) ...[
              const SizedBox(width: AppSpacing.sm),
              icon!,
            ],
          ],
        ),
      ),
    );
  }
}
