// [generated] generator=ThemeGenerator template=theme.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.

import 'package:flutter/material.dart';

// Design tokens (single source of truth — no raw colors in generated UI).
abstract final class AppColors {
  static const primary = Color(0xFF0D9488);
  static const surface = Color(0xFFFFFFFF);
  static const textPrimary = Color(0xFF1F2937);
  static const textSecondary = Color(0xFF475569);
  static const error = Color(0xFFDC2626);
}

// Rhythm / spacing scale (composition layer) — gap by intent, not fixed 16s.
abstract final class AppSpacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 40.0;
}

ThemeData buildTheme() => ThemeData(
  colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primary),
  useMaterial3: true,
  fontFamily: 'Roboto',
);
