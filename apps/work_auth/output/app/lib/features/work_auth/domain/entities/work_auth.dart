// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/work_auth_status.dart';

class WorkAuth extends Equatable {
  const WorkAuth({
    required this.id,
    required this.name,
    required this.country,
    required this.jobTitle,
    required this.startDate,
    required this.durationDays,
    required this.status,
  });

  final String id;
  final String name;
  final String country;
  final String jobTitle;
  final DateTime startDate;
  final int durationDays;
  final WorkAuthStatus status;

  @override
  List<Object?> get props => [id, name, country, jobTitle, startDate, durationDays, status];
}
