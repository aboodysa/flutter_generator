// [generated] generator=LocalizationGenerator template=localization.v2 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.

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
    'noData': 'No data',
    'newLabel': 'New',
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
    'noData': 'لا توجد بيانات',
    'newLabel': 'جديد',
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
  String get noData => _values['noData']!;
  String get newLabel => _values['newLabel']!;
}
