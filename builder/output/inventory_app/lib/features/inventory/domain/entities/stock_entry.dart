// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';


class StockEntry extends Equatable {
  const StockEntry({
    required this.id,
    required this.warehouseId,
    required this.quantity,
  });

  final String id;
  final String warehouseId;
  final int quantity;

  @override
  List<Object?> get props => [id];
}
