// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/profile.ui.json
// Product spec: specs/product/screens/profile.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'الملف الشخصي', showBack: false),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('أحمد محمد', style: AppTextStyles.title, textAlign: TextAlign.right),
                        const SizedBox(height: AppSpacing.xs),
                        Text('+966 59 877 7733', style: AppTextStyles.caption, textAlign: TextAlign.right),
                      ],
                    ),
                  ),
                  ProfileMenu(
                    title: 'الحساب',
                    items: [
                      SpecMenuItem(label: 'البيانات الشخصية', icon: 'person'),
                      SpecMenuItem(label: 'طلباتي', icon: 'orders'),
                      SpecMenuItem(label: 'مركباتي', icon: 'car'),
                      SpecMenuItem(label: 'المحفظة', icon: 'wallet'),
                      SpecMenuItem(label: 'إعلاناتي', icon: 'ads')
                    ],
                  ),
                  ProfileMenu(
                    title: 'الأمان',
                    items: [
                      SpecMenuItem(label: 'تغيير كلمة المرور', icon: 'lock')
                    ],
                  ),
                  ProfileMenu(
                    title: 'الإعدادات',
                    items: [
                      SpecMenuItem(label: 'اللغة', icon: 'language'),
                      SpecMenuItem(label: 'الدعم', icon: 'support')
                    ],
                  ),
                  AppButton.ghost('تسجيل خروج')
          ],
        ),
      footer:
        AppBottomNav(
          activeIndex: 3,
          items: [
        BottomNavItem(icon: Icons.home_outlined, label: 'الرئيسية'),
        BottomNavItem(icon: Icons.settings_outlined, label: 'My FAHS'),
        BottomNavItem(icon: Icons.chat_outlined, label: 'الشات'),
        BottomNavItem(icon: Icons.person_outlined, label: 'حسابي'),
          ],
        ),
      scroll: true,
    );
  }
}
