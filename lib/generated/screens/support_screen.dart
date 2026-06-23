// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/support.ui.json
// Product spec: specs/product/screens/support.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class SupportScreen extends StatelessWidget {
  const SupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'الدعم', showBack: true),
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
                        AppCard(child: Align(alignment: AlignmentDirectional.centerStart, child: Text('اتصال', style: AppTextStyles.title, textAlign: TextAlign.start))),
                      ),
                      Expanded(
                        child:
                        AppCard(child: Align(alignment: AlignmentDirectional.centerStart, child: Text('إيميل', style: AppTextStyles.title, textAlign: TextAlign.start))),
                      ),
                      Expanded(
                        child:
                        AppCard(child: Align(alignment: AlignmentDirectional.centerStart, child: Text('محادثة', style: AppTextStyles.title, textAlign: TextAlign.start))),
                      )
                    ],
                  ),
                  SpecList(
                    title: 'الأسئلة الشائعة',
                    items: [

                    ],
                  )
          ],
        ),
      footer:
        AppBottomNav(
          activeIndex: 2,
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
