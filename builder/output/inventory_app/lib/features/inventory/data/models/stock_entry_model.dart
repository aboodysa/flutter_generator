// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/stock_entry.dart';

class StockEntryModel {
  const StockEntryModel({
    required this.id,
    required this.warehouseId,
    required this.quantity,
  });

  final String id;
  final String warehouseId;
  final int quantity;

  factory StockEntryModel.fromJson(Map<String, dynamic> json) => StockEntryModel(
      id: json['id'] as String,
      warehouseId: json['warehouseId'] as String,
      quantity: json['quantity'] as int,
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'warehouseId': warehouseId,
      'quantity': quantity,
  };

  StockEntry toEntity() => StockEntry(
    id: id,
    warehouseId: warehouseId,
    quantity: quantity,
  );

  factory StockEntryModel.fromEntity(StockEntry e) => StockEntryModel(
    id: e.id,
    warehouseId: e.warehouseId,
    quantity: e.quantity,
  );
}
