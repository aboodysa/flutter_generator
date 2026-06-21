import 'package:flutter/material.dart';
import '../core/theme/theme.dart';

class StatusBadge extends StatelessWidget {
  final String text;
  final StatusBadgeVariant variant;

  const StatusBadge({
    super.key,
    required this.text,
    this.variant = StatusBadgeVariant.waiting,
  });

  factory StatusBadge.waiting(String text) =>
      StatusBadge(text: text, variant: StatusBadgeVariant.waiting);
  factory StatusBadge.inProgress(String text) =>
      StatusBadge(text: text, variant: StatusBadgeVariant.inProgress);
  factory StatusBadge.completed(String text) =>
      StatusBadge(text: text, variant: StatusBadgeVariant.completed);
  factory StatusBadge.cancelled(String text) =>
      StatusBadge(text: text, variant: StatusBadgeVariant.cancelled);
  factory StatusBadge.purple(String text) =>
      StatusBadge(text: text, variant: StatusBadgeVariant.purple);

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color textColor;

    switch (variant) {
      case StatusBadgeVariant.waiting:
        bgColor = AppColors.warning;
        textColor = AppColors.warningText;
      case StatusBadgeVariant.inProgress:
        bgColor = AppColors.info;
        textColor = AppColors.infoText;
      case StatusBadgeVariant.completed:
        bgColor = AppColors.successBg;
        textColor = AppColors.successText;
      case StatusBadgeVariant.cancelled:
        bgColor = AppColors.errorBg;
        textColor = AppColors.error;
      case StatusBadgeVariant.purple:
        bgColor = AppColors.lavender;
        textColor = AppColors.primary;
      case StatusBadgeVariant.gray:
        bgColor = AppColors.cultured;
        textColor = AppColors.textMuted;
    }

    return Container(
      height: 27,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppRadius.xs),
      ),
      child: Center(
        child: Text(
          text,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: textColor,
          ),
        ),
      ),
    );
  }
}

enum StatusBadgeVariant {
  waiting,
  inProgress,
  completed,
  cancelled,
  purple,
  gray
}
