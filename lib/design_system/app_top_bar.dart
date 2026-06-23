import 'package:flutter/material.dart';
import '../core/theme/theme.dart';

class AppTopBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final Widget? leading;
  final bool showBack;
  final List<Widget>? actions;

  const AppTopBar({
    super.key,
    this.title,
    this.leading,
    this.showBack = false,
    this.actions,
  });

  @override
  Size get preferredSize => const Size.fromHeight(54);

  @override
  Widget build(BuildContext context) {
    final textDirection = Directionality.of(context);

    return Container(
      height: 54,
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(
          bottom: BorderSide(color: Color(0xFFEEEEEE), width: 1),
        ),
      ),
      child: Row(
        textDirection: textDirection,
        children: [
          if (leading != null)
            leading!
          else if (showBack)
            IconButton(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              // arrow_back mirrors to the physical right in RTL locales.
              icon: const Icon(Icons.arrow_back, size: 20),
              onPressed: () {
                if (Navigator.of(context).canPop()) {
                  Navigator.of(context).pop();
                }
              },
            )
          else
            const SizedBox(width: 16),
          if (title != null)
            Expanded(
              child: Align(
                alignment: AlignmentDirectional.centerStart,
                child: Text(
                  title!,
                  style: AppTextStyles.title,
                  textAlign: TextAlign.start,
                ),
              ),
            ),
          if (actions != null) ...actions!,
          const SizedBox(width: 16),
        ],
      ),
    );
  }
}
