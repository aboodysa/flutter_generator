// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/category.dart';

class CategoryModel {
  const CategoryModel({
    required this.id,
    required this.name,
  });

  final String id;
  final String name;

  factory CategoryModel.fromJson(Map<String, dynamic> json) => CategoryModel(
      id: json['id'] as String,
      name: json['name'] as String,
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'name': name,
  };

  Category toEntity() => Category(
    id: id,
    name: name,
  );

  factory CategoryModel.fromEntity(Category e) => CategoryModel(
    id: e.id,
    name: e.name,
  );
}
