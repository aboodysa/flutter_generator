// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_expense/features/expense/data/models/expense_payment_entity_model.dart';
import 'package:rasheed_replica_expense/core/money.dart';
import 'package:rasheed_replica_expense/features/expense/domain/entities/payment_method.dart';
import 'package:rasheed_replica_expense/features/expense/data/models/transaction_attachment_entity_model.dart';
import 'package:rasheed_replica_expense/features/expense/domain/entities/transaction_entity.dart';
import 'package:rasheed_replica_expense/features/expense/data/models/transaction_item_entity_model.dart';

class TransactionEntityModel {
  const TransactionEntityModel({
    required this.id,
    required this.accountId,
    this.cycleId,
    required this.userId,
    this.categoryId,
    this.merchantId,
    this.merchant,
    this.branchName,
    required this.amount,
    this.vatAmount,
    this.discountAmount,
    this.totalQty,
    this.invoiceNumber,
    this.taxNumber,
    this.terminalCode,
    this.commercialRegisterNumber,
    this.paymentMethod,
    this.paymentMethodMap,
    this.cashierName,
    this.salesName,
    this.customerName,
    this.customerPhone,
    required this.transactionDateTime,
    this.notes,
    this.qrCode,
    this.subtotal,
    this.taxableAmount,
    this.totalSavings,
    this.usedCredit,
    this.netPayable,
    required this.transactionType,
    required this.captureMethod,
    required this.isDigitalReceipt,
    required this.createdAt,
    this.categoryName,
    this.sectionCode,
    this.sectionIconIndex,
    this.categoryIconAsset,
    this.categoryColorHex,
    this.captureMethodIconAsset,
    this.attachments = const [],
    this.items = const [],
    this.payments = const [],
    this.hasFeedback = false,
    this.nfcTransactionCode,
    this.isLongReceipt,
  });

  final String id;
  final String accountId;
  final String? cycleId;
  final String userId;
  final int? categoryId;
  final String? merchantId;
  final String? merchant;
  final String? branchName;
  final Money amount;
  final Money? vatAmount;
  final Money? discountAmount;
  final double? totalQty;
  final String? invoiceNumber;
  final String? taxNumber;
  final String? terminalCode;
  final String? commercialRegisterNumber;
  final PaymentMethod? paymentMethod;
  final String? paymentMethodMap;
  final String? cashierName;
  final String? salesName;
  final String? customerName;
  final String? customerPhone;
  final DateTime transactionDateTime;
  final String? notes;
  final String? qrCode;
  final Money? subtotal;
  final Money? taxableAmount;
  final Money? totalSavings;
  final Money? usedCredit;
  final Money? netPayable;
  final String transactionType;
  final String captureMethod;
  final bool isDigitalReceipt;
  final DateTime createdAt;
  final String? categoryName;
  final String? sectionCode;
  final int? sectionIconIndex;
  final String? categoryIconAsset;
  final String? categoryColorHex;
  final String? captureMethodIconAsset;
  final List<TransactionAttachmentEntityModel> attachments;
  final List<TransactionItemEntityModel> items;
  final List<ExpensePaymentEntityModel> payments;
  final bool hasFeedback;
  final String? nfcTransactionCode;
  final bool? isLongReceipt;

  factory TransactionEntityModel.fromJson(Map<String, dynamic> json) => TransactionEntityModel(
      id: json['id'] as String,
      accountId: json['accountId'] as String,
      cycleId: json['cycleId'] as String?,
      userId: json['userId'] as String,
      categoryId: json['categoryId'] as int?,
      merchantId: json['merchantId'] as String?,
      merchant: json['merchant'] as String?,
      branchName: json['branchName'] as String?,
      amount: Money.fromJson(json['amount'] as Map<String, dynamic>),
      vatAmount: json['vatAmount'] != null ? Money.fromJson(json['vatAmount'] as Map<String, dynamic>) : null,
      discountAmount: json['discountAmount'] != null ? Money.fromJson(json['discountAmount'] as Map<String, dynamic>) : null,
      totalQty: (json['totalQty'] as num?)?.toDouble(),
      invoiceNumber: json['invoiceNumber'] as String?,
      taxNumber: json['taxNumber'] as String?,
      terminalCode: json['terminalCode'] as String?,
      commercialRegisterNumber: json['commercialRegisterNumber'] as String?,
      paymentMethod: (json['paymentMethod'] as String?) != null ? PaymentMethod.values.byName(json['paymentMethod'] as String) : null,
      paymentMethodMap: json['paymentMethodMap'] as String?,
      cashierName: json['cashierName'] as String?,
      salesName: json['salesName'] as String?,
      customerName: json['customerName'] as String?,
      customerPhone: json['customerPhone'] as String?,
      transactionDateTime: DateTime.parse(json['transactionDateTime'] as String),
      notes: json['notes'] as String?,
      qrCode: json['qrCode'] as String?,
      subtotal: json['subtotal'] != null ? Money.fromJson(json['subtotal'] as Map<String, dynamic>) : null,
      taxableAmount: json['taxableAmount'] != null ? Money.fromJson(json['taxableAmount'] as Map<String, dynamic>) : null,
      totalSavings: json['totalSavings'] != null ? Money.fromJson(json['totalSavings'] as Map<String, dynamic>) : null,
      usedCredit: json['usedCredit'] != null ? Money.fromJson(json['usedCredit'] as Map<String, dynamic>) : null,
      netPayable: json['netPayable'] != null ? Money.fromJson(json['netPayable'] as Map<String, dynamic>) : null,
      transactionType: json['transactionType'] as String,
      captureMethod: json['captureMethod'] as String,
      isDigitalReceipt: json['isDigitalReceipt'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      categoryName: json['categoryName'] as String?,
      sectionCode: json['sectionCode'] as String?,
      sectionIconIndex: json['sectionIconIndex'] as int?,
      categoryIconAsset: json['categoryIconAsset'] as String?,
      categoryColorHex: json['categoryColorHex'] as String?,
      captureMethodIconAsset: json['captureMethodIconAsset'] as String?,
      attachments: (json['attachments'] as List?)?.map((e) => TransactionAttachmentEntityModel.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
      items: (json['items'] as List?)?.map((e) => TransactionItemEntityModel.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
      payments: (json['payments'] as List?)?.map((e) => ExpensePaymentEntityModel.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
      hasFeedback: json['hasFeedback'] as bool? ?? false,
      nfcTransactionCode: json['nfcTransactionCode'] as String?,
      isLongReceipt: json['isLongReceipt'] as bool?,
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'accountId': accountId,
      'cycleId': cycleId,
      'userId': userId,
      'categoryId': categoryId,
      'merchantId': merchantId,
      'merchant': merchant,
      'branchName': branchName,
      'amount': amount.toJson(),
      'vatAmount': vatAmount?.toJson(),
      'discountAmount': discountAmount?.toJson(),
      'totalQty': totalQty,
      'invoiceNumber': invoiceNumber,
      'taxNumber': taxNumber,
      'terminalCode': terminalCode,
      'commercialRegisterNumber': commercialRegisterNumber,
      'paymentMethod': paymentMethod?.name,
      'paymentMethodMap': paymentMethodMap,
      'cashierName': cashierName,
      'salesName': salesName,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'transactionDateTime': transactionDateTime.toIso8601String(),
      'notes': notes,
      'qrCode': qrCode,
      'subtotal': subtotal?.toJson(),
      'taxableAmount': taxableAmount?.toJson(),
      'totalSavings': totalSavings?.toJson(),
      'usedCredit': usedCredit?.toJson(),
      'netPayable': netPayable?.toJson(),
      'transactionType': transactionType,
      'captureMethod': captureMethod,
      'isDigitalReceipt': isDigitalReceipt,
      'createdAt': createdAt.toIso8601String(),
      'categoryName': categoryName,
      'sectionCode': sectionCode,
      'sectionIconIndex': sectionIconIndex,
      'categoryIconAsset': categoryIconAsset,
      'categoryColorHex': categoryColorHex,
      'captureMethodIconAsset': captureMethodIconAsset,
      'attachments': attachments.map((e) => e.toJson()).toList(),
      'items': items.map((e) => e.toJson()).toList(),
      'payments': payments.map((e) => e.toJson()).toList(),
      'hasFeedback': hasFeedback,
      'nfcTransactionCode': nfcTransactionCode,
      'isLongReceipt': isLongReceipt,
  };

  TransactionEntity toEntity() => TransactionEntity(
    id: id,
    accountId: accountId,
    cycleId: cycleId,
    userId: userId,
    categoryId: categoryId,
    merchantId: merchantId,
    merchant: merchant,
    branchName: branchName,
    amount: amount,
    vatAmount: vatAmount,
    discountAmount: discountAmount,
    totalQty: totalQty,
    invoiceNumber: invoiceNumber,
    taxNumber: taxNumber,
    terminalCode: terminalCode,
    commercialRegisterNumber: commercialRegisterNumber,
    paymentMethod: paymentMethod,
    paymentMethodMap: paymentMethodMap,
    cashierName: cashierName,
    salesName: salesName,
    customerName: customerName,
    customerPhone: customerPhone,
    transactionDateTime: transactionDateTime,
    notes: notes,
    qrCode: qrCode,
    subtotal: subtotal,
    taxableAmount: taxableAmount,
    totalSavings: totalSavings,
    usedCredit: usedCredit,
    netPayable: netPayable,
    transactionType: transactionType,
    captureMethod: captureMethod,
    isDigitalReceipt: isDigitalReceipt,
    createdAt: createdAt,
    categoryName: categoryName,
    sectionCode: sectionCode,
    sectionIconIndex: sectionIconIndex,
    categoryIconAsset: categoryIconAsset,
    categoryColorHex: categoryColorHex,
    captureMethodIconAsset: captureMethodIconAsset,
    attachments: attachments.map((e) => e.toEntity()).toList(),
    items: items.map((e) => e.toEntity()).toList(),
    payments: payments.map((e) => e.toEntity()).toList(),
    hasFeedback: hasFeedback,
    nfcTransactionCode: nfcTransactionCode,
    isLongReceipt: isLongReceipt,
  );

  factory TransactionEntityModel.fromEntity(TransactionEntity e) => TransactionEntityModel(
    id: e.id,
    accountId: e.accountId,
    cycleId: e.cycleId,
    userId: e.userId,
    categoryId: e.categoryId,
    merchantId: e.merchantId,
    merchant: e.merchant,
    branchName: e.branchName,
    amount: e.amount,
    vatAmount: e.vatAmount,
    discountAmount: e.discountAmount,
    totalQty: e.totalQty,
    invoiceNumber: e.invoiceNumber,
    taxNumber: e.taxNumber,
    terminalCode: e.terminalCode,
    commercialRegisterNumber: e.commercialRegisterNumber,
    paymentMethod: e.paymentMethod,
    paymentMethodMap: e.paymentMethodMap,
    cashierName: e.cashierName,
    salesName: e.salesName,
    customerName: e.customerName,
    customerPhone: e.customerPhone,
    transactionDateTime: e.transactionDateTime,
    notes: e.notes,
    qrCode: e.qrCode,
    subtotal: e.subtotal,
    taxableAmount: e.taxableAmount,
    totalSavings: e.totalSavings,
    usedCredit: e.usedCredit,
    netPayable: e.netPayable,
    transactionType: e.transactionType,
    captureMethod: e.captureMethod,
    isDigitalReceipt: e.isDigitalReceipt,
    createdAt: e.createdAt,
    categoryName: e.categoryName,
    sectionCode: e.sectionCode,
    sectionIconIndex: e.sectionIconIndex,
    categoryIconAsset: e.categoryIconAsset,
    categoryColorHex: e.categoryColorHex,
    captureMethodIconAsset: e.captureMethodIconAsset,
    attachments: e.attachments.map((x) => TransactionAttachmentEntityModel.fromEntity(x)).toList(),
    items: e.items.map((x) => TransactionItemEntityModel.fromEntity(x)).toList(),
    payments: e.payments.map((x) => ExpensePaymentEntityModel.fromEntity(x)).toList(),
    hasFeedback: e.hasFeedback,
    nfcTransactionCode: e.nfcTransactionCode,
    isLongReceipt: e.isLongReceipt,
  );
}
