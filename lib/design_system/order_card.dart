import 'package:flutter/material.dart';
import '../core/theme/theme.dart';
import 'status_badge.dart';

class OrderCard extends StatelessWidget {
  final String vehicleName;
  final String date;
  final StatusBadgeVariant statusVariant;
  final String statusText;
  final VoidCallback? onTap;

  const OrderCard({
    super.key,
    required this.vehicleName,
    required this.date,
    this.statusVariant = StatusBadgeVariant.waiting,
    this.statusText = 'قيد الانتظار',
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.line),
        ),
        child: Row(
          children: [
            const Icon(Icons.directions_car,
                size: 32, color: AppColors.textMuted),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  StatusBadge(text: statusText, variant: statusVariant),
                  const SizedBox(height: 4),
                  Text(vehicleName, style: AppTextStyles.label),
                  Text(date, style: AppTextStyles.caption),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
