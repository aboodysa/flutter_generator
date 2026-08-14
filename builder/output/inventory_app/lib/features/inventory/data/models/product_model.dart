// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_inventory/features/inventory/data/models/category_model.dart';
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/product.dart';
import 'package:rasheed_replica_inventory/features/inventory/data/models/stock_entry_model.dart';
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/stock_status.dart';
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/unit.dart';

class ProductModel {
  const ProductModel({
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
  final CategoryModel? category;
  final List<StockEntryModel> warehouses;

  factory ProductModel.fromJson(Map<String, dynamic> json) => ProductModel(
      id: json['id'] as String,
      name: json['name'] as String,
      sku: json['sku'] as String,
      price: (json['price'] as num).toDouble(),
      quantity: json['quantity'] as int,
      unit: Unit.values.byName(json['unit'] as String),
      status: StockStatus.values.byName(json['status'] as String),
      category: (json['category']) != null ? CategoryModel.fromJson(json['category'] as Map<String, dynamic>) : null,
      warehouses: (json['warehouses'] as List?)?.map((e) => StockEntryModel.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'name': name,
      'sku': sku,
      'price': price,
      'quantity': quantity,
      'unit': unit.name,
      'status': status.name,
      'category': category?.toJson(),
      'warehouses': warehouses.map((e) => e.toJson()).toList(),
  };

  Product toEntity() => Product(
    id: id,
    name: name,
    sku: sku,
    price: price,
    quantity: quantity,
    unit: unit,
    status: status,
    category: category?.toEntity(),
    warehouses: warehouses.map((e) => e.toEntity()).toList(),
  );

  factory ProductModel.fromEntity(Product e) => ProductModel(
    id: e.id,
    name: e.name,
    sku: e.sku,
    price: e.price,
    quantity: e.quantity,
    unit: e.unit,
    status: e.status,
    category: e.category != null ? CategoryModel.fromEntity(e.category!) : null,
    warehouses: e.warehouses.map((x) => StockEntryModel.fromEntity(x)).toList(),
  );
}
