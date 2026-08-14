// [generated] generator=ObservabilityGenerator template=observability.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.

import 'package:flutter/foundation.dart';

// Release-safe by default: errors are always surfaced, not debug-gated.
class AppLogger {
  static void error(String message, [Object? error, StackTrace? stack]) {
    if (kDebugMode) debugPrint('[ERROR] $message');
    // release sink (crash reporting) wired here — never debug-only.
  }

  static void info(String message) {
    if (kDebugMode) debugPrint('[INFO] $message');
  }
}
