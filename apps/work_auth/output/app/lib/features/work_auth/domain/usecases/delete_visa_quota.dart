// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_work_auth/features/work_auth/domain/repositories/visa_quota_repository.dart';

class DeleteVisaQuota {
  final VisaQuotaRepository repository;
  const DeleteVisaQuota(this.repository);

  Future<void> call(String params) => repository.deleteVisaQuota(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
