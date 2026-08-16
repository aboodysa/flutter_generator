// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/claim_status.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim.dart';
import 'package:rasheed_replica_ledgerly/core/money.dart';

class ExpenseClaimModel {
  const ExpenseClaimModel({
    required this.id,
    required this.name,
    required this.amount,
    required this.status,
    required this.exported,
  });

  final String id;
  final String name;
  final Money amount;
  final ClaimStatus status;
  final bool exported;

  factory ExpenseClaimModel.fromJson(Map<String, dynamic> json) => ExpenseClaimModel(
      id: json['id'] as String,
      name: json['name'] as String,
      amount: Money.fromJson(json['amount'] as Map<String, dynamic>),
      status: ClaimStatus.values.byName(json['status'] as String),
      exported: json['exported'] as bool? ?? false,
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'name': name,
      'amount': amount.toJson(),
      'status': status.name,
      'exported': exported,
  };

  ExpenseClaim toEntity() => ExpenseClaim(
    id: id,
    name: name,
    amount: amount,
    status: status,
    exported: exported,
  );

  factory ExpenseClaimModel.fromEntity(ExpenseClaim e) => ExpenseClaimModel(
    id: e.id,
    name: e.name,
    amount: e.amount,
    status: e.status,
    exported: e.exported,
  );
}
