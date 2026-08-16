// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_status.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_type.dart';

class LeaveRequest extends Equatable {
  const LeaveRequest({
    required this.id,
    required this.name,
    required this.leaveType,
    required this.startDate,
    required this.endDate,
    required this.days,
    required this.status,
    this.reason,
  });

  final String id;
  final String name;
  final LeaveType leaveType;
  final DateTime startDate;
  final DateTime endDate;
  final int days;
  final LeaveStatus status;
  final String? reason;

  @override
  List<Object?> get props => [id, name, leaveType, startDate, endDate, days, status, reason];
}
