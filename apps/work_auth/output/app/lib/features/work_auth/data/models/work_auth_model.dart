// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/work_auth.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/work_auth_status.dart';

class WorkAuthModel {
  const WorkAuthModel({
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

  factory WorkAuthModel.fromJson(Map<String, dynamic> json) => WorkAuthModel(
      id: json['id'] as String,
      name: json['name'] as String,
      country: json['country'] as String,
      jobTitle: json['jobTitle'] as String,
      startDate: DateTime.parse(json['startDate'] as String),
      durationDays: json['durationDays'] as int,
      status: WorkAuthStatus.values.byName(json['status'] as String),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'name': name,
      'country': country,
      'jobTitle': jobTitle,
      'startDate': startDate.toIso8601String(),
      'durationDays': durationDays,
      'status': status.name,
  };

  WorkAuth toEntity() => WorkAuth(
    id: id,
    name: name,
    country: country,
    jobTitle: jobTitle,
    startDate: startDate,
    durationDays: durationDays,
    status: status,
  );

  factory WorkAuthModel.fromEntity(WorkAuth e) => WorkAuthModel(
    id: e.id,
    name: e.name,
    country: e.country,
    jobTitle: e.jobTitle,
    startDate: e.startDate,
    durationDays: e.durationDays,
    status: e.status,
  );
}
