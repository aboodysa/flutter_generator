// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_expense/core/money.dart';
import 'package:rasheed_replica_expense/features/expense/domain/entities/transaction_item_entity.dart';

class TransactionItemEntityModel {
  const TransactionItemEntityModel({
    required this.id,
    required this.transactionEntityId,
    required this.name,
    required this.quantity,
    required this.totalPrice,
    required this.unitPrice,
    required this.disc,
    required this.vat,
  });

  final String id;
  final String transactionEntityId;
  final String name;
  final double quantity;
  final Money totalPrice;
  final Money unitPrice;
  final Money disc;
  final Money vat;

  factory TransactionItemEntityModel.fromJson(Map<String, dynamic> json) => TransactionItemEntityModel(
      id: json['id'] as String,
      transactionEntityId: json['transactionEntityId'] as String,
      name: json['name'] as String,
      quantity: (json['quantity'] as num).toDouble(),
      totalPrice: Money.fromJson(json['totalPrice'] as Map<String, dynamic>),
      unitPrice: Money.fromJson(json['unitPrice'] as Map<String, dynamic>),
      disc: Money.fromJson(json['disc'] as Map<String, dynamic>),
      vat: Money.fromJson(json['vat'] as Map<String, dynamic>),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'transactionEntityId': transactionEntityId,
      'name': name,
      'quantity': quantity,
      'totalPrice': totalPrice.toJson(),
      'unitPrice': unitPrice.toJson(),
      'disc': disc.toJson(),
      'vat': vat.toJson(),
  };

  TransactionItemEntity toEntity() => TransactionItemEntity(
    id: id,
    transactionEntityId: transactionEntityId,
    name: name,
    quantity: quantity,
    totalPrice: totalPrice,
    unitPrice: unitPrice,
    disc: disc,
    vat: vat,
  );

  factory TransactionItemEntityModel.fromEntity(TransactionItemEntity e) => TransactionItemEntityModel(
    id: e.id,
    transactionEntityId: e.transactionEntityId,
    name: e.name,
    quantity: e.quantity,
    totalPrice: e.totalPrice,
    unitPrice: e.unitPrice,
    disc: e.disc,
    vat: e.vat,
  );
}
