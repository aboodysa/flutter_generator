// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_keemart/features/keemart/domain/entities/in_stock_status.dart';
import 'package:rasheed_replica_keemart/core/money.dart';
import 'package:rasheed_replica_keemart/features/keemart/domain/entities/product.dart';

class ProductModel {
  const ProductModel({
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

  factory ProductModel.fromJson(Map<String, dynamic> json) => ProductModel(
      id: json['id'] as String,
      title: json['title'] as String,
      price: Money.fromJson(json['price'] as Map<String, dynamic>),
      oldPrice: json['oldPrice'] != null ? Money.fromJson(json['oldPrice'] as Map<String, dynamic>) : null,
      status: InStockStatus.values.byName(json['status'] as String),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'title': title,
      'price': price.toJson(),
      'oldPrice': oldPrice?.toJson(),
      'status': status.name,
  };

  Product toEntity() => Product(
    id: id,
    title: title,
    price: price,
    oldPrice: oldPrice,
    status: status,
  );

  factory ProductModel.fromEntity(Product e) => ProductModel(
    id: e.id,
    title: e.title,
    price: e.price,
    oldPrice: e.oldPrice,
    status: e.status,
  );
}
