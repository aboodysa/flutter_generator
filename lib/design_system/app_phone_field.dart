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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (label != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(label!, style: AppTextStyles.label),
          ),
        Container(
          height: 50,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.sm),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              const SizedBox(width: 12),
              const Text('🇸🇦', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 6),
              Text(countryCode,
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 14)),
              Container(
                width: 1,
                height: 26,
                color: AppColors.line,
                margin: const EdgeInsets.symmetric(horizontal: 8),
              ),
              Expanded(
                child: Text(
                  value ?? placeholder ?? '',
                  style: TextStyle(
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
