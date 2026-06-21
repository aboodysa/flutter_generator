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
    return Container(
      height: 54,
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(
          bottom: BorderSide(color: Color(0xFFEEEEEE), width: 1),
        ),
      ),
      child: Row(
        children: [
          if (leading != null)
            leading!
          else if (showBack)
            IconButton(
              icon: const Icon(Icons.arrow_forward_ios, size: 20),
              onPressed: () => Navigator.of(context).pop(),
            )
          else
            const SizedBox(width: 16),
          if (title != null)
            Expanded(
              child: Text(
                title!,
                style: AppTextStyles.title,
                textAlign: TextAlign.right,
              ),
            ),
          if (actions != null) ...actions!,
          const SizedBox(width: 16),
        ],
      ),
    );
  }
}
