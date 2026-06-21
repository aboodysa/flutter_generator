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
            color: enabled ? AppColors.surface : AppColors.cultured,
            borderRadius: BorderRadius.circular(AppRadius.sm),
            border: Border.all(color: AppColors.line),
          ),
          child: Row(
            children: [
              if (suffix != null)
                Padding(
                    padding: const EdgeInsets.only(left: 12), child: suffix!),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
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
                    textAlign: TextAlign.right,
                  ),
                ),
              ),
              if (prefix != null)
                Padding(
                    padding: const EdgeInsets.only(right: 12), child: prefix!),
            ],
          ),
        ),
      ],
    );
  }
}
