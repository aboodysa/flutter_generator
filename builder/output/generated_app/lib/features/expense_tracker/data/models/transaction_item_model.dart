// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction_item.dart';

class TransactionItemModel {
  const TransactionItemModel({
    required this.id,
    required this.name,
    required this.quantity,
    required this.unitPrice,
  });

  final String id;
  final String name;
  final double quantity;
  final double unitPrice;

  factory TransactionItemModel.fromJson(Map<String, dynamic> json) => TransactionItemModel(
      id: json['id'] as String,
      name: json['name'] as String,
      quantity: (json['quantity'] as num).toDouble(),
      unitPrice: (json['unitPrice'] as num).toDouble(),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'name': name,
      'quantity': quantity,
      'unitPrice': unitPrice,
  };

  TransactionItem toEntity() => TransactionItem(
    id: id,
    name: name,
    quantity: quantity,
    unitPrice: unitPrice,
  );

  factory TransactionItemModel.fromEntity(TransactionItem e) => TransactionItemModel(
    id: e.id,
    name: e.name,
    quantity: e.quantity,
    unitPrice: e.unitPrice,
  );
}
