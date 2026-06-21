import 'package:flutter/material.dart';
import '../core/theme/theme.dart';

class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool disabled;
  final bool loading;
  final AppButtonVariant variant;
  final double? width;
  final double? height;

  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.disabled = false,
    this.loading = false,
    this.variant = AppButtonVariant.primary,
    this.width,
    this.height,
  });

  factory AppButton.primary(String text,
      {VoidCallback? onPressed, bool disabled = false, bool loading = false}) {
    return AppButton(
        text: text,
        onPressed: onPressed,
        disabled: disabled,
        loading: loading,
        variant: AppButtonVariant.primary);
  }

  factory AppButton.outline(String text,
      {VoidCallback? onPressed, bool disabled = false}) {
    return AppButton(
        text: text,
        onPressed: onPressed,
        disabled: disabled,
        variant: AppButtonVariant.outline);
  }

  factory AppButton.ghost(String text,
      {VoidCallback? onPressed, bool disabled = false}) {
    return AppButton(
        text: text,
        onPressed: onPressed,
        disabled: disabled,
        variant: AppButtonVariant.ghost);
  }

  @override
  Widget build(BuildContext context) {
    final isDisabled = disabled || loading;
    Color bgColor;
    Color textColor;
    Color? borderColor;

    switch (variant) {
      case AppButtonVariant.primary:
        bgColor = isDisabled ? AppColors.neutral : AppColors.primary;
        textColor = AppColors.textOnPrimary;
      case AppButtonVariant.outline:
        bgColor = AppColors.surface;
        textColor = isDisabled ? AppColors.neutral : AppColors.primary;
        borderColor = AppColors.primary;
      case AppButtonVariant.ghost:
        bgColor = AppColors.surface;
        textColor = isDisabled ? AppColors.neutral : AppColors.textPrimary;
        borderColor = AppColors.line;
    }

    return SizedBox(
      width: width ?? double.infinity,
      height: height ?? 48,
      child: ElevatedButton(
        onPressed: isDisabled ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: bgColor,
          foregroundColor: textColor,
          disabledBackgroundColor: bgColor,
          disabledForegroundColor: textColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.sm),
            side: borderColor != null
                ? BorderSide(color: borderColor)
                : BorderSide.none,
          ),
          elevation: 0,
          textStyle: AppTextStyles.button.copyWith(color: textColor),
        ),
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: AppColors.textOnPrimary),
              )
            : Text(text),
      ),
    );
  }
}

enum AppButtonVariant { primary, outline, ghost }
