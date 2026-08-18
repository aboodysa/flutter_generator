// [generated] generator=ThemeGenerator template=theme.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.

import 'package:flutter/material.dart';

// Design tokens (single source of truth — no raw colors in generated UI).
// UIX Slice A: brand seed + semantic success/warning/danger/info, so the accent color has a
// role (status, priority, errors) instead of being a lone cyan. Dark mode is a ThemeData.dark
// built from the same tokens (attributes.themeMode picks it at the app root).
abstract final class AppColors {
  static const primary = Color(0xFF0D9488);
  static const surface = Color(0xFFFFFFFF);
  static const textPrimary = Color(0xFF1F2937);
  static const textSecondary = Color(0xFF475569);
  static const error = Color(0xFFDC2626);
  static const success = Color(0xFF16A34A);
  static const warning = Color(0xFFF59E0B);
  static const danger = Color(0xFFDC2626);
  static const info = Color(0xFF2563EB);
}

// Rhythm / spacing scale (composition layer) — gap by intent, not fixed 16s.
abstract final class AppSpacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 40.0;
}

// Radius scale — 12 for controls, 16 for surfaces, 24 for prominent containers (UIX Slice A).
abstract final class AppRadius {
  static const control = 12.0;
  static const surface = 16.0;
  static const container = 24.0;

  // S1 (SPIKE_S1_REPORT.md §14.2): per-screen cornerRadius scale groups — composition.ts's
  // visualFor() selects one of these by name (never a raw number at the call site); the flat
  // control/surface/container above stay the app-wide default and are also what "rounded"
  // aliases, so a screen with cornerRadius: "rounded" renders the same numbers as no visualStyle.
  static const sharpControl = 4.0;
  static const sharpSurface = 8.0;
  static const sharpContainer = 16.0;
  static const softControl = 8.0;
  static const softSurface = 12.0;
  static const softContainer = 20.0;
  static const roundedControl = control;
  static const roundedSurface = surface;
  static const roundedContainer = container;
  static const pillControl = 16.0;
  static const pillSurface = 24.0;
  static const pillContainer = 999.0;
}

ThemeData buildTheme() => ThemeData(
  colorScheme: ColorScheme.fromSeed(
    seedColor: AppColors.primary,
    brightness: Brightness.light,
  ),
  scaffoldBackgroundColor: const Color(0xFFF8FAFC),
  useMaterial3: true,
  fontFamily: 'Roboto',
  // UIX Slice A: near-zero elevation + tinted surfaces instead of persistent shadows.
  cardTheme: const CardThemeData(
    elevation: 0,
    margin: EdgeInsets.zero,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(AppRadius.surface))),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: const Color(0xFFF1F5F9),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(AppRadius.control)),
      borderSide: BorderSide.none,
    ),
    contentPadding: const EdgeInsets.all(AppSpacing.md),
  ),
);

// D1 (DESIGN_OPTS §1 O1.3): dark mirror — same seed/radius/spacing/fontFamily as buildTheme(),
// rendered on dark surfaces (scaffold + filled-input tint). The scaffold/fill hexes below are the
// deterministic dark palette; the [theme] validator asserts main.dart wires this in.
ThemeData buildThemeDark() => ThemeData(
  colorScheme: ColorScheme.fromSeed(
    seedColor: AppColors.primary,
    brightness: Brightness.dark,
  ),
  scaffoldBackgroundColor: const Color(0xFF0F172A),
  useMaterial3: true,
  fontFamily: 'Roboto',
  cardTheme: const CardThemeData(
    elevation: 0,
    margin: EdgeInsets.zero,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(AppRadius.surface))),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: const Color(0xFF1E293B),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(AppRadius.control)),
      borderSide: BorderSide.none,
    ),
    contentPadding: const EdgeInsets.all(AppSpacing.md),
  ),
);
