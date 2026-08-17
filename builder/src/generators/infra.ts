import { FeatureModel } from "../types";
import { hasLocale } from "../operations";

/**
 * Infra generators — structural, deterministic, 0% LLM.
 * Localization (ar/en), theme (tokens), config (env), secrets (secure storage), observability, validator.
 */

function hdr(gen: string, tpl: string): string {
  return `// [generated] generator=${gen} template=${tpl} class=structural ownership=generated\n// Do not hand-edit this file; regenerate from IR.\n`;
}

// Shared no-arg use-case params (§ use cases whose paramType is "NoParams", e.g. a plain list
// fetch) — emitted only when an IR actually declares one (index.ts gates the call), so apps that
// never use it don't carry a dead file.
export function generateNoParams(_f: FeatureModel): string {
  return `${hdr("NoParamsGenerator", "no_params.v1")}
class NoParams {
  const NoParams();
}
`;
}

// P7-L1: money as integer minor units + ISO 4217 currency code — never a raw double, so amounts
// never carry floating-point rounding error. Emitted only when the IR actually declares a
// `semanticType: "Money"` field (index.ts/symbols.ts gate on hasMoneyFields), so apps with no
// money never carry a dead file. `format()`/`_group()` assume a 2-decimal-exponent currency (SAR,
// USD, EUR, GBP, ...) with manual thousands-grouping — deliberately no `intl` dependency, kept
// deterministic and dependency-free like every other generated file.
export function generateMoney(_f: FeatureModel): string {
  return `${hdr("MoneyGenerator", "money.v1")}
import 'package:equatable/equatable.dart';

class Money extends Equatable {
  final int minorUnits;
  final String currency;

  const Money({required this.minorUnits, required this.currency});

  factory Money.fromMinorUnits(int minorUnits, String currency) => Money(minorUnits: minorUnits, currency: currency);

  factory Money.fromJson(Map<String, dynamic> json) => Money(
        minorUnits: (json['minorUnits'] as num).toInt(),
        currency: json['currency'] as String,
      );

  Map<String, dynamic> toJson() => {'minorUnits': minorUnits, 'currency': currency};

  bool get isNegative => minorUnits < 0;

  Money operator +(Money other) {
    assert(currency == other.currency, 'currency mismatch: \$currency vs \${other.currency}');
    return Money(minorUnits: minorUnits + other.minorUnits, currency: currency);
  }

  Money operator -(Money other) {
    assert(currency == other.currency, 'currency mismatch: \$currency vs \${other.currency}');
    return Money(minorUnits: minorUnits - other.minorUnits, currency: currency);
  }

  Money operator *(int factor) => Money(minorUnits: minorUnits * factor, currency: currency);

  bool operator <(Money other) => minorUnits < other.minorUnits;
  bool operator <=(Money other) => minorUnits <= other.minorUnits;
  bool operator >(Money other) => minorUnits > other.minorUnits;
  bool operator >=(Money other) => minorUnits >= other.minorUnits;

  String format() {
    final sign = minorUnits < 0 ? '-' : '';
    final abs = minorUnits.abs();
    final whole = _group(abs ~/ 100);
    final cents = (abs % 100).toString().padLeft(2, '0');
    return '\$sign\$whole.\$cents \$currency';
  }

  static String _group(int n) {
    final s = n.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return buf.toString();
  }

  @override
  String toString() => format();

  @override
  List<Object?> get props => [minorUnits, currency];
}
`;
}

// L4: locale-unaware apps (attributes.locale absent, the default) keep the exact pre-L4 flat
// class — byte-identical output, no behavior change for any existing sample.
function generateFlatLocalization(): string {
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

// L4: locale-aware apps get a small, FIXED vocabulary (app chrome: appTitle/loading/error/retry/
// save/create/back/edit/delete/cancel/audit/noData/newLabel) resolved per-locale via
// AppStrings.of(context) — cancel + audit added for P4 (delete-confirm dialog cancel; audit
// action label). Deliberately NOT per-entity/per-field labels (fieldLabel() output, entity plural
// titles): those
// are dynamically derived from whatever the IR's author named a field/entity, and there is no
// deterministic, 0%-LLM source for their Arabic translation without inventing content. Documented
// scope boundary, not silently dropped — see the task report.
function generateLocaleAwareLocalization(): string {
  return `${hdr("LocalizationGenerator", "localization.v2")}
import 'package:flutter/widgets.dart';

class AppStrings {
  const AppStrings._(this._values);
  final Map<String, String> _values;

  static const Map<String, String> _en = <String, String>{
    'appTitle': 'Generated app',
    'loading': 'Loading…',
    'error': 'Something went wrong',
    'retry': 'Retry',
    'save': 'Save',
    'create': 'Create',
    'back': 'Back',
    'edit': 'Edit',
    'delete': 'Delete',
    'cancel': 'Cancel',
    'audit': 'Audit log',
    'noData': 'No data',
    'newLabel': 'New',
    'signIn': 'Sign in',
    'chooseDemoAccount': 'Choose a demo account',
  };

  static const Map<String, String> _ar = <String, String>{
    'appTitle': 'التطبيق المُنشأ',
    'loading': 'جارٍ التحميل…',
    'error': 'حدث خطأ ما',
    'retry': 'إعادة المحاولة',
    'save': 'حفظ',
    'create': 'إنشاء',
    'back': 'رجوع',
    'edit': 'تعديل',
    'delete': 'حذف',
    'cancel': 'إلغاء',
    'audit': 'سجل التدقيق',
    'noData': 'لا توجد بيانات',
    'newLabel': 'جديد',
    'signIn': 'تسجيل الدخول',
    'chooseDemoAccount': 'اختر حساباً تجريبياً',
  };

  /// Resolves from the nearest Localizations ancestor (MaterialApp sets this up from its own
  /// locale/supportedLocales) — falls back to English when no Localizations ancestor exists yet
  /// (e.g. called above MaterialApp, such as MaterialApp.onGenerateTitle's own context).
  static AppStrings of(BuildContext context) {
    final code = Localizations.maybeLocaleOf(context)?.languageCode;
    return AppStrings._(code == 'ar' ? _ar : _en);
  }

  String get appTitle => _values['appTitle']!;
  String get loading => _values['loading']!;
  String get error => _values['error']!;
  String get retry => _values['retry']!;
  String get save => _values['save']!;
  String get create => _values['create']!;
  String get back => _values['back']!;
  String get edit => _values['edit']!;
  String get delete => _values['delete']!;
  String get cancel => _values['cancel']!;
  String get audit => _values['audit']!;
  String get noData => _values['noData']!;
  String get newLabel => _values['newLabel']!;
  String get signIn => _values['signIn']!;
  String get chooseDemoAccount => _values['chooseDemoAccount']!;
}
`;
}

export function generateLocalization(f: FeatureModel): string {
  return hasLocale(f) ? generateLocaleAwareLocalization() : generateFlatLocalization();
}

export function generateTheme(_f: FeatureModel): string {
  return `${hdr("ThemeGenerator", "theme.v1")}
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
