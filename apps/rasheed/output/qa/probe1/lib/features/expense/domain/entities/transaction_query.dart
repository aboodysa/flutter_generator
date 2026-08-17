// [generated] generator=QueryGenerator template=query.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.

class TransactionQuery {
  final int page;
  final int limit;
  final String accountCode;
  final String? storeName;
  final List<int>? categoryCodes;
  final DateTime? startDate;
  final DateTime? endDate;
  final List<int>? paymentMethodCodes;
  final double? minAmount;
  final double? maxAmount;
  final bool allTransactions;
  final String? cycleCode;
  final String? memberCode;

  const TransactionQuery({
    this.page = 1,
    this.limit = 50,
    required this.accountCode,
    this.storeName,
    this.categoryCodes,
    this.startDate,
    this.endDate,
    this.paymentMethodCodes,
    this.minAmount,
    this.maxAmount,
    this.allTransactions = false,
    this.cycleCode,
    this.memberCode,
  });

  TransactionQuery copyWith({
    int? page,
    int? limit,
    String? accountCode,
    String? storeName,
    List<int>? categoryCodes,
    DateTime? startDate,
    DateTime? endDate,
    List<int>? paymentMethodCodes,
    double? minAmount,
    double? maxAmount,
    bool? allTransactions,
    String? cycleCode,
    String? memberCode,
  }) => TransactionQuery(
    page: page ?? this.page,
    limit: limit ?? this.limit,
    accountCode: accountCode ?? this.accountCode,
    storeName: storeName,
    categoryCodes: categoryCodes,
    startDate: startDate,
    endDate: endDate,
    paymentMethodCodes: paymentMethodCodes,
    minAmount: minAmount,
    maxAmount: maxAmount,
    allTransactions: allTransactions ?? this.allTransactions,
    cycleCode: cycleCode,
    memberCode: memberCode,
  );

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{};
    params['page'] = page;
    params['limit'] = limit;
    params['pocketCode'] = accountCode;
    if (storeName != null) params['storeName'] = storeName;
    if (categoryCodes != null) params['categoryCode'] = categoryCodes;
    if (startDate != null) params['startDate'] = startDate;
    if (endDate != null) params['endDate'] = endDate;
    if (paymentMethodCodes != null) params['paymentMethodCode'] = paymentMethodCodes;
    if (minAmount != null) params['minAmount'] = minAmount;
    if (maxAmount != null) params['maxAmount'] = maxAmount;
    params['allTransactions'] = allTransactions;
    if (cycleCode != null) params['cycleCode'] = cycleCode;
    if (memberCode != null) params['memberCode'] = memberCode;
    return params;
  }
}
