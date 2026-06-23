import 'package:flutter/material.dart';
import '../core/theme/theme.dart';

class AppPhoneField extends StatelessWidget {
  final String? label;
  final String? placeholder;
  final String? value;
  final String countryCode;

  const AppPhoneField({
    super.key,
    this.label,
    this.placeholder,
    this.value,
    this.countryCode = '+966',
  });

  @override
  Widget build(BuildContext context) {
    final mixedScriptStyle = TextStyle(
      fontFamily: 'Roboto',
      fontFamilyFallback: const ['Tajawal'],
      fontWeight: FontWeight.w700,
      fontSize: 14,
    );

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
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.sm),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
          ),
          child: Row(
            textDirection: Directionality.of(context),
            children: [
              const SizedBox(width: 12),
              const Text('🇸🇦', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 6),
              Text(
                countryCode,
                textDirection: TextDirection.ltr,
                style: mixedScriptStyle,
              ),
              Container(
                width: 1,
                height: 26,
                color: AppColors.line,
                margin: const EdgeInsetsDirectional.symmetric(horizontal: 8),
              ),
              Expanded(
                child: Text(
                  value ?? placeholder ?? '',
                  textAlign: TextAlign.start,
                  textDirection: Directionality.of(context),
                  style: TextStyle(
                    fontFamily: 'Roboto',
                    fontFamilyFallback: const ['Tajawal'],
                    fontSize: 14,
                    color: value != null
                        ? AppColors.textPrimary
                        : AppColors.textPlaceholder,
                  ),
                ),
              ),
              const SizedBox(width: 12),
            ],
          ),
        ),
      ],
    );
  }
}
