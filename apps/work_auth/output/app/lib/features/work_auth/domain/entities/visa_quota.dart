// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_work_auth/core/money.dart';

class VisaQuota extends Equatable {
  const VisaQuota({
    required this.id,
    required this.name,
    required this.limit,
    required this.committed,
    required this.actual,
  });

  final String id;
  final String name;
  final Money limit;
  final Money committed;
  final Money actual;

  @override
  List<Object?> get props => [id, name, limit, committed, actual];
}
