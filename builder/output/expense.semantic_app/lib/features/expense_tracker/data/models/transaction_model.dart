// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/data/models/category_model.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/payment_method.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/data/models/transaction_attachment_model.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/data/models/transaction_item_model.dart';

class TransactionModel {
  const TransactionModel({
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
  final CategoryModel? category;
  final PaymentMethod paymentMethod;
  final String? note;
  final List<TransactionItemModel> items;
  final List<TransactionAttachmentModel> attachments;

  factory TransactionModel.fromJson(Map<String, dynamic> json) => TransactionModel(
      id: json['id'] as String,
      amount: (json['amount'] as num).toDouble(),
      date: DateTime.parse(json['date'] as String),
      merchant: json['merchant'] as String?,
      category: (json['category']) != null ? CategoryModel.fromJson(json['category'] as Map<String, dynamic>) : null,
      paymentMethod: PaymentMethod.values.byName(json['paymentMethod'] as String),
      note: json['note'] as String?,
      items: (json['items'] as List?)?.map((e) => TransactionItemModel.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
      attachments: (json['attachments'] as List?)?.map((e) => TransactionAttachmentModel.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'amount': amount,
      'date': date.toIso8601String(),
      'merchant': merchant,
      'category': category?.toJson(),
      'paymentMethod': paymentMethod.name,
      'note': note,
      'items': items.map((e) => e.toJson()).toList(),
      'attachments': attachments.map((e) => e.toJson()).toList(),
  };

  Transaction toEntity() => Transaction(
    id: id,
    amount: amount,
    date: date,
    merchant: merchant,
    category: category?.toEntity(),
    paymentMethod: paymentMethod,
    note: note,
    items: items.map((e) => e.toEntity()).toList(),
    attachments: attachments.map((e) => e.toEntity()).toList(),
  );

  factory TransactionModel.fromEntity(Transaction e) => TransactionModel(
    id: e.id,
    amount: e.amount,
    date: e.date,
    merchant: e.merchant,
    category: e.category != null ? CategoryModel.fromEntity(e.category!) : null,
    paymentMethod: e.paymentMethod,
    note: e.note,
    items: e.items.map((x) => TransactionItemModel.fromEntity(x)).toList(),
    attachments: e.attachments.map((x) => TransactionAttachmentModel.fromEntity(x)).toList(),
  );
}
