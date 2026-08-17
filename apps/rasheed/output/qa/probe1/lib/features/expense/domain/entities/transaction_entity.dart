// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_expense/features/expense/domain/entities/expense_payment_entity.dart';
import 'package:rasheed_replica_expense/core/money.dart';
import 'package:rasheed_replica_expense/features/expense/domain/entities/payment_method.dart';
import 'package:rasheed_replica_expense/features/expense/domain/entities/transaction_attachment_entity.dart';
import 'package:rasheed_replica_expense/features/expense/domain/entities/transaction_item_entity.dart';

class TransactionEntity extends Equatable {
  const TransactionEntity({
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
  final List<TransactionAttachmentEntity> attachments;
  final List<TransactionItemEntity> items;
  final List<ExpensePaymentEntity> payments;
  final bool hasFeedback;
  final String? nfcTransactionCode;
  final bool? isLongReceipt;

  @override
  List<Object?> get props => [id];
}
