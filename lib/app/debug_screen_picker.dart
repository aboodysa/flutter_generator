import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../design_system/design_system.dart';
import '../generated/app/router.g.dart';

class DebugScreenPicker extends StatelessWidget {
  const DebugScreenPicker({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Screen Picker'),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          const Text('Open a generated screen', style: AppTextStyles.title),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Temporary debug page for jumping between generated Flutter screens.',
            style:
                AppTextStyles.bodyRegular.copyWith(color: AppColors.textMuted),
          ),
          const SizedBox(height: AppSpacing.lg),
          for (final screen in generatedScreenEntries)
            _DebugScreenTile(
              title: screen.title,
              route: screen.route,
              screenId: screen.screenId,
              onTap: () => context.goNamed(screen.screenId),
            ),
        ],
      ),
    );
  }
}

class _DebugScreenTile extends StatelessWidget {
  const _DebugScreenTile({
    required this.title,
    required this.route,
    required this.screenId,
    required this.onTap,
  });

  final String title;
  final String route;
  final String screenId;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.md),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: AppColors.line),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: AppTextStyles.title),
                    const SizedBox(height: 4),
                    Text(route,
                        style: AppTextStyles.bodyRegular
                            .copyWith(color: AppColors.textMuted)),
                    const SizedBox(height: 2),
                    Text('screenId: $screenId', style: AppTextStyles.caption),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded, size: 16),
            ],
          ),
        ),
      ),
    );
  }
}
