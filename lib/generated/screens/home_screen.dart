// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/home.ui.json
// Product spec: specs/product/screens/home.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../design_system/design_system.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

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
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      spacing: AppSpacing.sm,
                      children: [
                            AppBanner.peach(title: 'نقل ملكية مركبة', subtitle: 'قدم طلب نقل ملكية لمركبتك الآن'),
                            AppBanner(title: 'حجز فحص المركبة', subtitle: 'احجز موعد الفحص الآن')
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('الطلبات', style: AppTextStyles.title),
                      Text('عرض الكل', style: AppTextStyles.caption),
                    ],
                  ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                            OrderCard(
                              vehicleName: 'تويوتا كورولا ٢٠٢٤',
                              date: 'أرسل في 10 يونيو 2024',
                            ),
                                const SizedBox(height: AppSpacing.sm),
                            OrderCard(
                              vehicleName: 'تويوتا كورولا ٢٠٢٤',
                              date: 'أرسل في 10 يونيو 2024',
                            )
                              ],
                            )
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('الخدمات', style: AppTextStyles.title),
                    ],
                  ),
                            GestureDetector(
                              onTap: () => context.goNamed('ownership_transfer'),
                              child: AppCard.peach(
                                child: Text('نقل الملكية', style: AppTextStyles.title),
                              ),
                            ),
                            GestureDetector(
                              onTap: () => context.goNamed('inspection'),
                              child: AppCard.lavender(
                                child: Text('فحص السيارة', style: AppTextStyles.title),
                              ),
                            )
                    ],
                  )
          ],
        ),
      footer:
        AppBottomNav(
          activeIndex: 0,
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
