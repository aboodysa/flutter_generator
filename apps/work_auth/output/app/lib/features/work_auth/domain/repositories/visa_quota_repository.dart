// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/visa_quota.dart';

abstract interface class VisaQuotaRepository {
  Future<List<VisaQuota>> listVisaQuotas();
  Future<VisaQuota> createVisaQuota(VisaQuota quota);
  Future<void> updateVisaQuota(VisaQuota quota);
  Future<void> deleteVisaQuota(String id);
}
