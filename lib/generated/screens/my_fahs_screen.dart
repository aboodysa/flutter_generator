// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/my_fahs.ui.json
// Product spec: specs/product/screens/my_fahs.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class MyFahsScreen extends StatelessWidget {
  const MyFahsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        const LogoHeader(),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  Row(
                    spacing: AppSpacing.sm,
                    children: [
                      Expanded(
                        child:
                        AppCard(child: Text('فحص السيارة', style: AppTextStyles.title, textAlign: TextAlign.right)),
                      ),
                      Expanded(
                        child:
                        AppCard(child: Text('نقل الملكية', style: AppTextStyles.title, textAlign: TextAlign.right)),
                      )
                    ],
                  ),
                  WalletCard(title: 'المحفظة', balance: '١٢٥ ريال'),
                  AppCard(child: Text('طلباتي', style: AppTextStyles.title, textAlign: TextAlign.right)),
                  AppCard(child: Text('مركباتي', style: AppTextStyles.title, textAlign: TextAlign.right)),
                  AppCard(child: Text('إعلاناتي', style: AppTextStyles.title, textAlign: TextAlign.right))
          ],
        ),
      footer:
        AppBottomNav(
          activeIndex: 1,
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
