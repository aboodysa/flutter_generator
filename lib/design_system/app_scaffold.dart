import 'package:flutter/material.dart';
import '../core/theme/theme.dart';

class AppScaffold extends StatelessWidget {
  final Widget? header;
  final Widget? body;
  final Widget? footer;
  final bool scroll;
  final EdgeInsetsGeometry padding;

  const AppScaffold({
    super.key,
    this.header,
    this.body,
    this.footer,
    this.scroll = true,
    this.padding = const EdgeInsets.all(AppSpacing.lg),
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            if (header != null) header!,
            Expanded(
              child: scroll
                  ? SingleChildScrollView(
                      padding: padding,
                      child: body,
                    )
                  : Padding(
                      padding: padding,
                      child: body,
                    ),
            ),
            if (footer != null) footer!,
          ],
        ),
      ),
    );
  }
}
