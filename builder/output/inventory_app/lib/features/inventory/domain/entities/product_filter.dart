// [generated] generator=QueryGenerator template=query.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/stock_status.dart';

class ProductFilter {
  final String? search;
  final StockStatus? status;
  final double? minPrice;
  final double? maxPrice;

  const ProductFilter({
    this.search,
    this.status,
    this.minPrice,
    this.maxPrice,
  });

  ProductFilter copyWith({
    String? search,
    StockStatus? status,
    double? minPrice,
    double? maxPrice,
  }) => ProductFilter(
    search: search,
    status: status,
    minPrice: minPrice,
    maxPrice: maxPrice,
  );

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{};
    if (search != null) params['search'] = search;
    if (status != null) params['status'] = status;
    if (minPrice != null) params['minPrice'] = minPrice;
    if (maxPrice != null) params['maxPrice'] = maxPrice;
    return params;
  }
}
