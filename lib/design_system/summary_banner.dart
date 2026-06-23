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
      padding: const EdgeInsetsDirectional.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: color ?? AppColors.cultured,
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Row(
        textDirection: Directionality.of(context),
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Text(
                    title,
                    style: AppTextStyles.label,
                    textAlign: TextAlign.start,
                  ),
                ),
                const SizedBox(height: 4),
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Text(
                    subtitle,
                    style: AppTextStyles.caption,
                    textAlign: TextAlign.start,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          StatusBadge.purple(price),
        ],
      ),
    );
  }
}
