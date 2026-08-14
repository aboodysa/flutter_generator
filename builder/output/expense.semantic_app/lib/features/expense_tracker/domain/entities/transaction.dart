// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/category.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/payment_method.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction_attachment.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction_item.dart';

class Transaction extends Equatable {
  const Transaction({
    required this.id,
    required this.amount,
    required this.date,
    this.merchant,
    this.category,
    required this.paymentMethod,
    this.note,
    this.items = const [],
    this.attachments = const [],
  });

  final String id;
  final double amount;
  final DateTime date;
  final String? merchant;
  final Category? category;
  final PaymentMethod paymentMethod;
  final String? note;
  final List<TransactionItem> items;
  final List<TransactionAttachment> attachments;

  @override
  List<Object?> get props => [id];
}
