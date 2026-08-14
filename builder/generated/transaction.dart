// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

class Transaction extends Equatable {
  const Transaction({
    required this.id,
    required this.transactionCode,
    required this.amount,
    this.currency = 'SAR',
    required this.date,
    this.note,
    this.category,
    required this.paymentMethod,
    this.items = const [],
    this.attachments = const [],
    this.isDeleted = false,
  });

  final String id;
  final String transactionCode;
  final Money amount;
  final String currency;
  final DateTime date;
  final String? note;
  final ExpenseCategory? category;
  final PaymentMethod paymentMethod;
  final List<TransactionItem> items;
  final List<TransactionAttachment> attachments;
  final bool isDeleted;

  @override
  List<Object?> get props => [id];
}
