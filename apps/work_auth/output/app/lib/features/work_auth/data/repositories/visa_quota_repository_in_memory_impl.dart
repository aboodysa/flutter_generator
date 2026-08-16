// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_work_auth/features/work_auth/domain/repositories/visa_quota_repository.dart';
import 'package:rasheed_replica_work_auth/core/money.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/visa_quota.dart';

class VisaQuotaRepositoryInMemoryImpl implements VisaQuotaRepository {
  final List<VisaQuota> _items = [VisaQuota(id: 'x', name: 'Sample VisaQuota', limit: Money(minorUnits: 100000, currency: 'VSA'), committed: Money(minorUnits: 20000, currency: 'VSA'), actual: Money(minorUnits: 38000, currency: 'VSA')), VisaQuota(id: 'visa-quota-1', name: 'Sample VisaQuota 1', limit: Money(minorUnits: 60000, currency: 'VSA'), committed: Money(minorUnits: 15000, currency: 'VSA'), actual: Money(minorUnits: 44000, currency: 'VSA')), VisaQuota(id: 'visa-quota-2', name: 'Sample VisaQuota 2', limit: Money(minorUnits: 40000, currency: 'VSA'), committed: Money(minorUnits: 10000, currency: 'VSA'), actual: Money(minorUnits: 35000, currency: 'VSA'))];

  @override
  Future<List<VisaQuota>> listVisaQuotas() async => List.unmodifiable(_items);

  @override
  Future<VisaQuota> createVisaQuota(VisaQuota quota) async {
    _items.add(quota);
    return quota;
  }

  @override
  Future<void> updateVisaQuota(VisaQuota quota) async {
    final idx = _items.indexWhere((e) => e.id == quota.id);
    if (idx != -1) _items[idx] = quota;
  }

  @override
  Future<void> deleteVisaQuota(String id) async {
    _items.removeWhere((e) => e.id == id);
  }

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
