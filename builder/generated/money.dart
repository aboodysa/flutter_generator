// [generated] generator=ValueObjectGenerator template=value_object.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
class Money {
  const Money(this.value)
      : assert(value >= 0, 'Money must be >= 0');

  final double value;

  @override
  bool operator ==(Object other) => other is Money && other.value == value;

  @override
  int get hashCode => value.hashCode;

  @override
  String toString() => value.toString();
}
