// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_work_auth/core/no_params.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/visa_quota.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/repositories/visa_quota_repository.dart';

class ListVisaQuotas {
  final VisaQuotaRepository repository;
  const ListVisaQuotas(this.repository);

  Future<List<VisaQuota>> call(NoParams params) => repository.listVisaQuotas();

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
