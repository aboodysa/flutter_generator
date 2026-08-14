// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'transaction_item_entity.dart';

class TransactionItemEntityModel {
  const TransactionItemEntityModel({
    required this.id,
    required this.transactionId,
    required this.itemName,
    required this.quantity,
    required this.totalPrice,
    required this.unitPrice,
    required this.disc,
    required this.vat,
  });

  final String id;
  final String transactionId;
  final String itemName;
  final double quantity;
  final double totalPrice;
  final double unitPrice;
  final double disc;
  final double vat;

  factory TransactionItemEntityModel.fromJson(Map<String, dynamic> json) => TransactionItemEntityModel(
      id: json['id'] as String,
      transactionId: json['transactionId'] as String,
      itemName: json['itemName'] as String,
      quantity: (json['quantity'] as num).toDouble(),
      totalPrice: (json['totalPrice'] as num).toDouble(),
      unitPrice: (json['unitPrice'] as num).toDouble(),
      disc: (json['disc'] as num).toDouble(),
      vat: (json['vat'] as num).toDouble(),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'transactionId': transactionId,
      'itemName': itemName,
      'quantity': quantity,
      'totalPrice': totalPrice,
      'unitPrice': unitPrice,
      'disc': disc,
      'vat': vat,
  };

  TransactionItemEntity toEntity() => TransactionItemEntity(
    id: id,
    transactionId: transactionId,
    itemName: itemName,
    quantity: quantity,
    totalPrice: totalPrice,
    unitPrice: unitPrice,
    disc: disc,
    vat: vat,
  );

  factory TransactionItemEntityModel.fromEntity(TransactionItemEntity e) => TransactionItemEntityModel(
    id: e.id,
    transactionId: e.transactionId,
    itemName: e.itemName,
    quantity: e.quantity,
    totalPrice: e.totalPrice,
    unitPrice: e.unitPrice,
    disc: e.disc,
    vat: e.vat,
  );
}
