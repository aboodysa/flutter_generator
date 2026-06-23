import 'package:flutter/material.dart';
import '../core/theme/theme.dart';
import 'status_badge.dart';

class PaymentMethodOption {
  final String id;
  final String label;
  final String? icon;
  final String? balance;
  final bool selected;

  const PaymentMethodOption({
    required this.id,
    required this.label,
    this.icon,
    this.balance,
    this.selected = false,
  });
}

class PaymentMethodList extends StatefulWidget {
  final String label;
  final List<PaymentMethodOption> methods;
  final String? selectedId;
  final ValueChanged<String>? onChanged;

  const PaymentMethodList({
    super.key,
    required this.label,
    required this.methods,
    this.selectedId,
    this.onChanged,
  });

  @override
  State<PaymentMethodList> createState() => _PaymentMethodListState();
}

class _PaymentMethodListState extends State<PaymentMethodList> {
  String? _selectedId;

  @override
  void initState() {
    super.initState();
    _selectedId = _initialSelectedId();
  }

  @override
  void didUpdateWidget(covariant PaymentMethodList oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.selectedId != oldWidget.selectedId ||
        !_hasMethod(widget.methods, _selectedId)) {
      _selectedId = _initialSelectedId();
    }
  }

  String? _initialSelectedId() {
    if (widget.selectedId != null &&
        _hasMethod(widget.methods, widget.selectedId)) {
      return widget.selectedId;
    }

    for (final method in widget.methods) {
      if (method.selected) {
        return method.id;
      }
    }

    for (final method in widget.methods) {
      if (method.balance != null && method.balance!.trim().isNotEmpty) {
        return method.id;
      }
    }

    return widget.methods.isNotEmpty ? widget.methods.first.id : null;
  }

  bool _hasMethod(List<PaymentMethodOption> methods, String? id) {
    if (id == null) return false;
    return methods.any((method) => method.id == id);
  }

  TextStyle _labelStyleFor(String text) {
    final hasLatin = RegExp(r'[A-Za-z0-9]').hasMatch(text);
    if (!hasLatin) {
      return AppTextStyles.bodyRegular;
    }
    return AppTextStyles.bodyRegular.copyWith(
      fontFamily: 'Roboto',
      fontFamilyFallback: const ['Tajawal'],
    );
  }

  void _select(String id) {
    if (_selectedId == id) return;
    setState(() {
      _selectedId = id;
    });
    widget.onChanged?.call(id);
  }

  IconData _iconFor(String? name) {
    switch (name) {
      case 'card':
        return Icons.credit_card_rounded;
      case 'mada':
        return Icons.payments_outlined;
      case 'bank':
        return Icons.account_balance_outlined;
      case 'stc':
        return Icons.phone_android_outlined;
      case 'tamara':
        return Icons.schedule_outlined;
      case 'wallet':
        return Icons.account_balance_wallet_outlined;
      default:
        return Icons.circle_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Align(
          alignment: AlignmentDirectional.centerStart,
          child: Text(
            widget.label,
            style: AppTextStyles.label,
            textAlign: TextAlign.start,
          ),
        ),
        const SizedBox(height: 8),
        for (final method in widget.methods) ...[
          _PaymentMethodTile(
            label: method.label,
            labelStyle: _labelStyleFor(method.label),
            balance: method.balance,
            icon: method.icon != null ? _iconFor(method.icon) : null,
            selected: method.id == _selectedId,
            onTap: () => _select(method.id),
          ),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}

class _PaymentMethodTile extends StatelessWidget {
  final String label;
  final TextStyle labelStyle;
  final String? balance;
  final IconData? icon;
  final bool selected;
  final VoidCallback onTap;

  const _PaymentMethodTile({
    required this.label,
    required this.labelStyle,
    required this.selected,
    required this.onTap,
    this.balance,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final borderColor = selected ? AppColors.primary : AppColors.line;
    final radioColor = selected ? AppColors.primary : AppColors.line;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.sm),
        child: Container(
          padding: const EdgeInsetsDirectional.fromSTEB(12, 14, 12, 14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.sm),
            border: Border.all(color: borderColor, width: selected ? 2 : 1),
          ),
          child: Row(
            textDirection: Directionality.of(context),
            children: [
              Icon(
                selected ? Icons.radio_button_checked : Icons.radio_button_off,
                size: 20,
                color: radioColor,
              ),
              if (icon != null) ...[
                const SizedBox(width: 8),
                Icon(icon, size: 18, color: AppColors.textMuted),
              ],
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: labelStyle,
                  textAlign: TextAlign.start,
                ),
              ),
              if (balance != null) ...[
                const SizedBox(width: 8),
                StatusBadge.purple(balance!),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
