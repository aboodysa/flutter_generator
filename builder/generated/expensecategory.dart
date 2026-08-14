// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

class ExpenseCategory extends Equatable {
  const ExpenseCategory({
    required this.id,
    required this.name,
    required this.scope,
    this.iconAsset,
  });

  final String id;
  final String name;
  final Scope scope;
  final String? iconAsset;

  @override
  List<Object?> get props => [id];
}
