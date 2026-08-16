// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/claim_status.dart';
import 'package:rasheed_replica_ledgerly/core/money.dart';

class ExpenseClaim extends Equatable {
  const ExpenseClaim({
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

  @override
  List<Object?> get props => [id, name, amount, status, exported];
}
