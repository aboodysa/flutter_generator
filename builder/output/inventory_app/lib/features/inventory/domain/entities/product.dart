// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_inventory/features/inventory/domain/entities/category.dart';
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/stock_entry.dart';
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/stock_status.dart';
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/unit.dart';

class Product extends Equatable {
  const Product({
    required this.id,
    required this.name,
    required this.sku,
    required this.price,
    required this.quantity,
    required this.unit,
    required this.status,
    this.category,
    this.warehouses = const [],
  });

  final String id;
  final String name;
  final String sku;
  final double price;
  final int quantity;
  final Unit unit;
  final StockStatus status;
  final Category? category;
  final List<StockEntry> warehouses;

  @override
  List<Object?> get props => [id];
}
