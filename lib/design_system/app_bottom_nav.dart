import 'package:flutter/material.dart';
import '../core/theme/theme.dart';

class AppBottomNav extends StatelessWidget {
  final int activeIndex;
  final List<BottomNavItem> items;

  const AppBottomNav({
    super.key,
    this.activeIndex = 0,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 64,
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(
          top: BorderSide(color: Color(0xFFEEEEEE), width: 1),
        ),
      ),
      child: Row(
        children: items.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          final isActive = index == activeIndex;
          return Expanded(
            child: GestureDetector(
              onTap: item.onTap,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      item.icon,
                      size: 22,
                      color: isActive ? AppColors.primary : AppColors.textMuted,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.label,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight:
                            isActive ? FontWeight.w700 : FontWeight.w400,
                        color:
                            isActive ? AppColors.primary : AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class BottomNavItem {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  const BottomNavItem({required this.icon, required this.label, this.onTap});
}
