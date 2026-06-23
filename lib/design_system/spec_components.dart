import 'package:flutter/material.dart';
import '../core/theme/theme.dart';
import 'app_card.dart';
import 'app_text_field.dart';

IconData specIcon(String? name) {
  switch (name) {
    case 'ads':
      return Icons.campaign_outlined;
    case 'bank':
      return Icons.account_balance_outlined;
    case 'calendar':
      return Icons.calendar_month_outlined;
    case 'camera':
      return Icons.photo_camera_outlined;
    case 'car':
      return Icons.directions_car_outlined;
    case 'chat':
      return Icons.chat_outlined;
    case 'clock':
      return Icons.schedule_outlined;
    case 'home':
      return Icons.home_outlined;
    case 'language':
      return Icons.language_outlined;
    case 'lock':
      return Icons.lock_outline;
    case 'orders':
      return Icons.receipt_long_outlined;
    case 'person':
      return Icons.person_outline;
    case 'profile':
      return Icons.person_outline;
    case 'settings':
      return Icons.tune_outlined;
    case 'support':
      return Icons.support_agent_outlined;
    case 'wallet':
      return Icons.account_balance_wallet_outlined;
    default:
      return Icons.circle_outlined;
  }
}

class SpecMenuItem {
  const SpecMenuItem({
    required this.label,
    this.icon,
    this.subtitle,
  });

  final String label;
  final String? icon;
  final String? subtitle;
}

class ServiceCard extends StatelessWidget {
  const ServiceCard({
    super.key,
    required this.title,
    this.subtitle,
    this.price,
  });

  final String title;
  final String? subtitle;
  final String? price;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Text(
                    title,
                    style: AppTextStyles.title,
                    textAlign: TextAlign.start,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: Text(
                      subtitle!,
                      style: AppTextStyles.caption,
                      textAlign: TextAlign.start,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (price != null) ...[
            const SizedBox(width: AppSpacing.md),
            _SpecChip(label: price!),
          ],
        ],
      ),
    );
  }
}

class VehicleCard extends StatelessWidget {
  const VehicleCard({
    super.key,
    required this.title,
    this.subtitle,
    this.plate,
    this.status,
  });

  final String title;
  final String? subtitle;
  final String? plate;
  final String? status;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          const Icon(Icons.directions_car_outlined, color: AppColors.primary),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Text(
                    title,
                    style: AppTextStyles.title,
                    textAlign: TextAlign.start,
                  ),
                ),
                if (subtitle != null)
                  Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: Text(subtitle!, style: AppTextStyles.caption),
                  ),
                if (plate != null)
                  Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: Text(plate!, style: AppTextStyles.caption),
                  ),
              ],
            ),
          ),
          if (status != null) _SpecChip(label: status!),
        ],
      ),
    );
  }
}

class WalletCard extends StatelessWidget {
  const WalletCard({
    super.key,
    required this.balance,
    this.title = 'المحفظة',
  });

  final String title;
  final String balance;

  @override
  Widget build(BuildContext context) {
    return AppCard.lavender(
      child: Row(
        children: [
          const Icon(Icons.account_balance_wallet_outlined,
              color: AppColors.primary),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Text(title,
                      style: AppTextStyles.caption,
                      textAlign: TextAlign.start),
                ),
                const SizedBox(height: AppSpacing.xs),
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Text(balance,
                      style: AppTextStyles.heading,
                      textAlign: TextAlign.start),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class AppBottomSheet extends StatelessWidget {
  const AppBottomSheet({
    super.key,
    required this.children,
  });

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: children,
      ),
    );
  }
}

class TimelineStepData {
  const TimelineStepData({
    required this.label,
    this.completed = false,
  });

  final String label;
  final bool completed;
}

class InspectionTimeline extends StatelessWidget {
  const InspectionTimeline({super.key, required this.steps});

  final List<TimelineStepData> steps;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        children: [
          for (final step in steps)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: Row(
                children: [
                  Icon(
                    step.completed
                        ? Icons.check_circle
                        : Icons.radio_button_unchecked,
                    color:
                        step.completed ? AppColors.success : AppColors.neutral,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: Text(
                        step.label,
                        style: AppTextStyles.bodyRegular,
                        textAlign: TextAlign.start,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class PhotoGrid extends StatelessWidget {
  const PhotoGrid({super.key, required this.label, this.count = 4});

  final String label;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Align(
          alignment: AlignmentDirectional.centerStart,
          child: Text(label,
              style: AppTextStyles.label, textAlign: TextAlign.start),
        ),
        const SizedBox(height: AppSpacing.sm),
        GridView.count(
          crossAxisCount: 2,
          mainAxisSpacing: AppSpacing.sm,
          crossAxisSpacing: AppSpacing.sm,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            for (var i = 0; i < count; i++)
              Container(
                decoration: BoxDecoration(
                  color: AppColors.cultured,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  border: Border.all(color: AppColors.line),
                ),
                child: const Icon(Icons.image_outlined,
                    color: AppColors.textMuted),
              ),
          ],
        ),
      ],
    );
  }
}

class ProfileMenu extends StatelessWidget {
  const ProfileMenu({
    super.key,
    required this.title,
    required this.items,
  });

  final String title;
  final List<SpecMenuItem> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Align(
          alignment: AlignmentDirectional.centerStart,
          child: Text(title,
              style: AppTextStyles.label, textAlign: TextAlign.start),
        ),
        const SizedBox(height: AppSpacing.sm),
        AppCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              for (final item in items)
                ListTile(
                  leading: Icon(specIcon(item.icon), color: AppColors.primary),
                  title: Text(item.label, textAlign: TextAlign.start),
                  subtitle: item.subtitle == null
                      ? null
                      : Text(item.subtitle!, textAlign: TextAlign.start),
                  trailing: const Icon(Icons.chevron_left),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class VehiclePlate extends StatelessWidget {
  const VehiclePlate({
    super.key,
    this.label,
    this.placeholder,
    this.value,
  });

  final String? label;
  final String? placeholder;
  final String? value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (label != null)
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: Text(label!,
                style: AppTextStyles.label, textAlign: TextAlign.start),
          ),
        if (label != null) const SizedBox(height: AppSpacing.sm),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.sm),
            border: Border.all(color: AppColors.line),
          ),
          child: Text(
            value ?? placeholder ?? '',
            textAlign: TextAlign.start,
            style: AppTextStyles.title,
          ),
        ),
      ],
    );
  }
}

class AppSearchField extends StatelessWidget {
  const AppSearchField({super.key, required this.placeholder});

  final String placeholder;

  @override
  Widget build(BuildContext context) {
    return AppTextField(
      placeholder: placeholder,
      prefix: const Icon(Icons.search, color: AppColors.textMuted),
    );
  }
}

class AppSegmentedControl extends StatelessWidget {
  const AppSegmentedControl({
    super.key,
    required this.items,
    this.activeIndex = 0,
  });

  final List<String> items;
  final int activeIndex;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.cultured,
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Row(
        textDirection: TextDirection.rtl,
        children: [
          for (var i = 0; i < items.length; i++)
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                decoration: BoxDecoration(
                  color:
                      i == activeIndex ? AppColors.surface : Colors.transparent,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Text(
                  items[i],
                  textAlign: TextAlign.center,
                  style: AppTextStyles.label.copyWith(
                    color: i == activeIndex
                        ? AppColors.primary
                        : AppColors.textMuted,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class AppChipGroup extends StatelessWidget {
  const AppChipGroup({
    super.key,
    required this.items,
    this.activeIndex = 0,
  });

  final List<String> items;
  final int activeIndex;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      alignment: WrapAlignment.end,
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      children: [
        for (var i = 0; i < items.length; i++)
          _SpecChip(
            label: items[i],
            selected: i == activeIndex,
          ),
      ],
    );
  }
}

class OtpInput extends StatelessWidget {
  const OtpInput({super.key, this.length = 4});

  final int length;

  @override
  Widget build(BuildContext context) {
    return Row(
      textDirection: TextDirection.ltr,
      children: [
        for (var i = 0; i < length; i++) ...[
          Expanded(
            child: Container(
              height: 56,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.sm),
                border: Border.all(color: AppColors.line),
              ),
              child: Text('•', style: AppTextStyles.heading),
            ),
          ),
          if (i < length - 1) const SizedBox(width: AppSpacing.sm),
        ],
      ],
    );
  }
}

class AppSelectField extends StatelessWidget {
  const AppSelectField({
    super.key,
    this.label,
    required this.placeholder,
    this.options = const [],
  });

  final String? label;
  final String placeholder;
  final List<String> options;

  @override
  Widget build(BuildContext context) {
    return AppTextField(
      label: label,
      placeholder: options.isEmpty ? placeholder : options.first,
      prefix: const Icon(Icons.keyboard_arrow_down, color: AppColors.textMuted),
    );
  }
}

class AmountField extends StatelessWidget {
  const AmountField({
    super.key,
    this.label,
    this.placeholder,
    this.currency,
  });

  final String? label;
  final String? placeholder;
  final String? currency;

  @override
  Widget build(BuildContext context) {
    return AppTextField(
      label: label,
      placeholder: placeholder ?? '0',
      suffix: Text(currency ?? 'ر.س', style: AppTextStyles.label),
    );
  }
}

class SpecList extends StatelessWidget {
  const SpecList({
    super.key,
    this.title,
    this.items = const [],
  });

  final String? title;
  final List<SpecMenuItem> items;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (title != null)
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Align(
                alignment: AlignmentDirectional.centerStart,
                child: Text(title!,
                    style: AppTextStyles.title, textAlign: TextAlign.start),
              ),
            ),
          for (final item in items)
            ListTile(
              title: Text(item.label, textAlign: TextAlign.start),
              subtitle: item.subtitle == null
                  ? null
                  : Text(item.subtitle!, textAlign: TextAlign.start),
              trailing: const Icon(Icons.chevron_left),
            ),
        ],
      ),
    );
  }
}

class _SpecChip extends StatelessWidget {
  const _SpecChip({
    required this.label,
    this.selected = false,
  });

  final String label;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: selected ? AppColors.lavender : AppColors.cultured,
        borderRadius: BorderRadius.circular(AppRadius.sm),
        border:
            Border.all(color: selected ? AppColors.primary : AppColors.line),
      ),
      child: Text(
        label,
        style: AppTextStyles.caption.copyWith(
          color: selected ? AppColors.primary : AppColors.textPrimary,
        ),
      ),
    );
  }
}
