// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_work_auth/core/money.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/visa_quota.dart';

class VisaQuotaModel {
  const VisaQuotaModel({
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

  factory VisaQuotaModel.fromJson(Map<String, dynamic> json) => VisaQuotaModel(
      id: json['id'] as String,
      name: json['name'] as String,
      limit: Money.fromJson(json['limit'] as Map<String, dynamic>),
      committed: Money.fromJson(json['committed'] as Map<String, dynamic>),
      actual: Money.fromJson(json['actual'] as Map<String, dynamic>),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'name': name,
      'limit': limit.toJson(),
      'committed': committed.toJson(),
      'actual': actual.toJson(),
  };

  VisaQuota toEntity() => VisaQuota(
    id: id,
    name: name,
    limit: limit,
    committed: committed,
    actual: actual,
  );

  factory VisaQuotaModel.fromEntity(VisaQuota e) => VisaQuotaModel(
    id: e.id,
    name: e.name,
    limit: e.limit,
    committed: e.committed,
    actual: e.actual,
  );
}
