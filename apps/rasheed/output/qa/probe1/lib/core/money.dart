// [generated] generator=MoneyGenerator template=money.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.

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
    assert(currency == other.currency, 'currency mismatch: $currency vs ${other.currency}');
    return Money(minorUnits: minorUnits + other.minorUnits, currency: currency);
  }

  Money operator -(Money other) {
    assert(currency == other.currency, 'currency mismatch: $currency vs ${other.currency}');
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
    return '$sign$whole.$cents $currency';
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
