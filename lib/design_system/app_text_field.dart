import 'package:flutter/material.dart';
import '../core/theme/theme.dart';

class AppTextField extends StatelessWidget {
  final String? label;
  final String? placeholder;
  final String? value;
  final Widget? prefix;
  final Widget? suffix;
  final bool enabled;

  const AppTextField({
    super.key,
    this.label,
    this.placeholder,
    this.value,
    this.prefix,
    this.suffix,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    final textDirection = Directionality.of(context);
    final isRtl = textDirection == TextDirection.rtl;
    final leadingSlot = isRtl ? suffix : prefix;
    final trailingSlot = isRtl ? prefix : suffix;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (label != null)
          Padding(
            padding: const EdgeInsetsDirectional.only(bottom: 8),
            child: Align(
              alignment: AlignmentDirectional.centerStart,
              child: Text(
                label!,
                style: AppTextStyles.label,
                textAlign: TextAlign.start,
              ),
            ),
          ),
        Container(
          height: 50,
          decoration: BoxDecoration(
            color: enabled ? AppColors.surface : AppColors.cultured,
            borderRadius: BorderRadius.circular(AppRadius.sm),
            border: Border.all(color: AppColors.line),
          ),
          child: Row(
            textDirection: textDirection,
            children: [
              if (leadingSlot != null)
                Padding(
                  padding: const EdgeInsetsDirectional.only(end: 12),
                  child: leadingSlot,
                ),
              Expanded(
                child: Padding(
                  padding:
                      const EdgeInsetsDirectional.symmetric(horizontal: 12),
                  child: Text(
                    value ?? placeholder ?? '',
                    style: TextStyle(
                      fontSize: 14,
                      color: value != null
                          ? AppColors.textPrimary
                          : AppColors.textPlaceholder,
                      fontWeight:
                          value != null ? FontWeight.w500 : FontWeight.w400,
                    ),
                    textAlign: TextAlign.start,
                  ),
                ),
              ),
              if (trailingSlot != null)
                Padding(
                  padding: const EdgeInsetsDirectional.only(start: 12),
                  child: trailingSlot,
                ),
            ],
          ),
        ),
      ],
    );
  }
}
