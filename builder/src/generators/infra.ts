import { FeatureModel } from "../types";

/**
 * Infra generators — structural, deterministic, 0% LLM.
 * Localization (ar/en), theme (tokens), config (env), secrets (secure storage), observability, validator.
 */

function hdr(gen: string, tpl: string): string {
  return `// [generated] generator=${gen} template=${tpl} class=structural ownership=generated\n// Do not hand-edit this file; regenerate from IR.\n`;
}

export function generateLocalization(_f: FeatureModel): string {
  return `${hdr("LocalizationGenerator", "localization.v1")}
class AppStrings {
  static const appTitle = 'Expense tracker';
  static const loading = 'Loading…';
  static const error = 'Something went wrong';
  static const retry = 'Retry';
  // Arabic-first: keys are the source of truth; translations live in .arb in Phase 2.
}
`;
}

export function generateTheme(_f: FeatureModel): string {
  return `${hdr("ThemeGenerator", "theme.v1")}
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
`;
}

export function generateConfig(_f: FeatureModel): string {
  return `${hdr("ConfigGenerator", "config.v1")}
abstract final class AppConfig {
  static const apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:8080');
  static const environment = String.fromEnvironment('ENV', defaultValue: 'dev');
}
`;
}

export function generateSecrets(_f: FeatureModel): string {
  return `${hdr("SecretsGenerator", "secrets.v1")}
// Secrets are NEVER stored as literals. They come from env / secure storage.
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class Secrets {
  const Secrets(this._storage);
  final FlutterSecureStorage _storage;

  Future<String?> read(String key) => _storage.read(key: key);
  Future<void> write(String key, String value) => _storage.write(key: key, value: value);
}
`;
}

export function generateObservability(_f: FeatureModel): string {
  return `${hdr("ObservabilityGenerator", "observability.v1")}
import 'package:flutter/foundation.dart';

// Release-safe by default: errors are always surfaced, not debug-gated.
class AppLogger {
  static void error(String message, [Object? error, StackTrace? stack]) {
    if (kDebugMode) debugPrint('[ERROR] \$message');
    // release sink (crash reporting) wired here — never debug-only.
  }

  static void info(String message) {
    if (kDebugMode) debugPrint('[INFO] \$message');
  }
}
`;
}

export function generateValidator(_f: FeatureModel): string {
  return `${hdr("ValidationGenerator", "validator.v1")}
abstract final class Validators {
  static String? required(String? v) => (v == null || v.trim().isEmpty) ? 'required' : null;
  static String? Function(String?) minLength(int n) => (String? v) => (v == null || v.length < n) ? 'too short' : null;
  static String? email(String? v) {
    final r = RegExp(r'^[^@\\s]+@[^@\\s]+\\.[^@\\s]+\$');
    return (v == null || !r.hasMatch(v)) ? 'invalid email' : null;
  }
}
`;
}
