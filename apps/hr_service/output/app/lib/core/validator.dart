// [generated] generator=ValidationGenerator template=validator.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.

abstract final class Validators {
  static String? required(String? v) => (v == null || v.trim().isEmpty) ? 'required' : null;
  static String? Function(String?) minLength(int n) => (String? v) => (v == null || v.length < n) ? 'too short' : null;
  static String? email(String? v) {
    final r = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    return (v == null || !r.hasMatch(v)) ? 'invalid email' : null;
  }
}
