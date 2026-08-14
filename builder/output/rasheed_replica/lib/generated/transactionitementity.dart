// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';


class TransactionItemEntity extends Equatable {
  const TransactionItemEntity({
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

  @override
  List<Object?> get props => [id];
}
