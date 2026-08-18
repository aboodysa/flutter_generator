// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_keemart/features/keemart/domain/entities/in_stock_status.dart';
import 'package:rasheed_replica_keemart/core/money.dart';

class Product extends Equatable {
  const Product({
    required this.id,
    required this.title,
    required this.price,
    this.oldPrice,
    required this.status,
  });

  final String id;
  final String title;
  final Money price;
  final Money? oldPrice;
  final InStockStatus status;

  @override
  List<Object?> get props => [id];
}
