// [generated] generator=QueryGenerator template=query.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.

class TransactionFilter {
  final String? search;
  final List<int>? categoryIds;
  final double? minAmount;
  final double? maxAmount;

  const TransactionFilter({
    this.search,
    this.categoryIds,
    this.minAmount,
    this.maxAmount,
  });

  TransactionFilter copyWith({
    String? search,
    List<int>? categoryIds,
    double? minAmount,
    double? maxAmount,
  }) => TransactionFilter(
    search: search,
    categoryIds: categoryIds,
    minAmount: minAmount,
    maxAmount: maxAmount,
  );

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{};
    if (search != null) params['search'] = search;
    if (categoryIds != null) params['categoryIds'] = categoryIds;
    if (minAmount != null) params['minAmount'] = minAmount;
    if (maxAmount != null) params['maxAmount'] = maxAmount;
    return params;
  }
}
