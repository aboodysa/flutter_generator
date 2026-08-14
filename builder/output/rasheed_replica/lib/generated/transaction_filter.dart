// [generated] generator=QueryGenerator template=query.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
class TransactionFilter {
  final String searchQuery;

  const TransactionFilter({
    this.searchQuery = '',
  });

  TransactionFilter copyWith({
    String? searchQuery,
  }) => TransactionFilter(
    searchQuery: searchQuery ?? this.searchQuery,
  );

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{};
    params['searchQuery'] = searchQuery;
    return params;
  }
}
