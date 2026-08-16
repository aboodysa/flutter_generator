// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_request.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_status.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_type.dart';

class LeaveRequestModel {
  const LeaveRequestModel({
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

  factory LeaveRequestModel.fromJson(Map<String, dynamic> json) => LeaveRequestModel(
      id: json['id'] as String,
      name: json['name'] as String,
      leaveType: LeaveType.values.byName(json['leaveType'] as String),
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: DateTime.parse(json['endDate'] as String),
      days: json['days'] as int,
      status: LeaveStatus.values.byName(json['status'] as String),
      reason: json['reason'] as String?,
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'name': name,
      'leaveType': leaveType.name,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'days': days,
      'status': status.name,
      'reason': reason,
  };

  LeaveRequest toEntity() => LeaveRequest(
    id: id,
    name: name,
    leaveType: leaveType,
    startDate: startDate,
    endDate: endDate,
    days: days,
    status: status,
    reason: reason,
  );

  factory LeaveRequestModel.fromEntity(LeaveRequest e) => LeaveRequestModel(
    id: e.id,
    name: e.name,
    leaveType: e.leaveType,
    startDate: e.startDate,
    endDate: e.endDate,
    days: e.days,
    status: e.status,
    reason: e.reason,
  );
}
