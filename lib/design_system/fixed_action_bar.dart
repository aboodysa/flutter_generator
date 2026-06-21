import 'package:flutter/material.dart';
import '../core/theme/theme.dart';

class FixedActionBar extends StatelessWidget {
  final String buttonLabel;
  final VoidCallback? onPressed;
  final bool disabled;

  const FixedActionBar({
    super.key,
    required this.buttonLabel,
    this.onPressed,
    this.disabled = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(
          top: BorderSide(color: Color(0xFFEEEEEE), width: 1),
        ),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 48,
        child: ElevatedButton(
          onPressed: disabled ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: disabled ? AppColors.neutral : AppColors.primary,
            foregroundColor: AppColors.textOnPrimary,
            disabledBackgroundColor: AppColors.neutral,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            elevation: 0,
          ),
          child: Text(buttonLabel, style: AppTextStyles.button),
        ),
      ),
    );
  }
}
