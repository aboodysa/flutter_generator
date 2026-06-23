// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/wallet.ui.json
// Product spec: specs/product/screens/wallet.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'محفظتي', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  WalletCard(title: 'المحفظة', balance: '١٢٥ ريال'),
                  Row(
                    spacing: AppSpacing.sm,
                    children: [
                      Expanded(
                        child:
                        AppCard(child: Text('إضافة رصيد', style: AppTextStyles.title, textAlign: TextAlign.right)),
                      ),
                      Expanded(
                        child:
                        AppCard(child: Text('سحب رصيد', style: AppTextStyles.title, textAlign: TextAlign.right)),
                      )
                    ],
                  ),
                  Column(
                    spacing: AppSpacing.md,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                            AppCard(child: Text('إضافة رصيد', style: AppTextStyles.title, textAlign: TextAlign.right))
                    ],
                  )
          ],
        ),
      footer: null,
      scroll: true,
    );
  }
}
