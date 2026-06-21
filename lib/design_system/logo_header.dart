import 'package:flutter/material.dart';
import '../core/theme/theme.dart';

class LogoHeader extends StatelessWidget {
  final bool showNotification;

  const LogoHeader({super.key, this.showNotification = true});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 54,
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        children: [
          if (showNotification)
            IconButton(
              icon: const Icon(Icons.notifications_outlined, size: 24),
              onPressed: () {},
            ),
          const Spacer(),
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(9),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('فحص',
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                          height: 0.78)),
                  Text('FAHS',
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                          height: 0.78)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
