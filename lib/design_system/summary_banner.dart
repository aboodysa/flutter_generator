import 'package:flutter/material.dart';
import '../core/theme/theme.dart';
import 'status_badge.dart';

class SummaryBanner extends StatelessWidget {
  final String title;
  final String subtitle;
  final String price;
  final Color? color;

  const SummaryBanner({
    super.key,
    required this.title,
    required this.subtitle,
    required this.price,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: color ?? AppColors.cultured,
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Row(
        children: [
          StatusBadge.purple(price),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(title, style: AppTextStyles.label),
                const SizedBox(height: 4),
                Text(subtitle, style: AppTextStyles.caption),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
