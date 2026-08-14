// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'expense_payment_entity.dart';
import 'transaction_attachment_entity.dart';
import 'transaction_item_entity.dart';

class TransactionEntity extends Equatable {
  const TransactionEntity({
    required this.id,
    required this.accountId,
    this.cycleId,
    required this.userId,
    this.categoryId,
    this.merchantId,
    this.merchantNameRaw,
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
  final String? merchantNameRaw;
  final String? branchName;
  final double amount;
  final double? vatAmount;
  final double? discountAmount;
  final double? totalQty;
  final String? invoiceNumber;
  final String? taxNumber;
  final String? terminalCode;
  final String? commercialRegisterNumber;
  final String? paymentMethod;
  final String? paymentMethodMap;
  final String? cashierName;
  final String? salesName;
  final String? customerName;
  final String? customerPhone;
  final DateTime transactionDateTime;
  final String? notes;
  final String? qrCode;
  final double? subtotal;
  final double? taxableAmount;
  final double? totalSavings;
  final double? usedCredit;
  final double? netPayable;
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
  final List<TransactionAttachmentEntity> attachments;
  final List<TransactionItemEntity> items;
  final List<ExpensePaymentEntity> payments;
  final bool hasFeedback;
  final String? nfcTransactionCode;
  final bool? isLongReceipt;

  @override
  List<Object?> get props => [id];
}
