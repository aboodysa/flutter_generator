// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_ledgerly/features/budgets/domain/repositories/meal_budget_repository.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/entities/meal_budget.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/data/models/meal_budget_model.dart';
import 'package:rasheed_replica_ledgerly/core/money.dart';
import 'package:rasheed_replica_ledgerly/core/outbox.dart';

class MealBudgetRepositoryInMemoryImpl implements MealBudgetRepository {
  final List<MealBudget> _items = [MealBudget(id: 'x', name: 'Sample MealBudget', limit: Money(minorUnits: 100000, currency: 'SAR'), committed: Money(minorUnits: 20000, currency: 'SAR'), actual: Money(minorUnits: 38000, currency: 'SAR')), MealBudget(id: 'meal-budget-1', name: 'Sample MealBudget 1', limit: Money(minorUnits: 60000, currency: 'SAR'), committed: Money(minorUnits: 15000, currency: 'SAR'), actual: Money(minorUnits: 44000, currency: 'SAR')), MealBudget(id: 'meal-budget-2', name: 'Sample MealBudget 2', limit: Money(minorUnits: 40000, currency: 'SAR'), committed: Money(minorUnits: 10000, currency: 'SAR'), actual: Money(minorUnits: 35000, currency: 'SAR'))];

  @override
  Future<List<MealBudget>> listMealBudgets() async => List.unmodifiable(_items);

  @override
  Future<MealBudget> createMealBudget(MealBudget budget) async {
    Outbox.instance.enqueue(
      entity: 'MealBudget',
      entityId: budget.id.toString(),
      action: 'create',
      payload: MealBudgetModel.fromEntity(budget).toJson(),
    );
    _items.add(budget);
    return budget;
  }

  @override
  Future<void> updateMealBudget(MealBudget budget) async {
    final idx = _items.indexWhere((e) => e.id == budget.id);
    if (idx != -1) {
      Outbox.instance.enqueue(
        entity: 'MealBudget',
        entityId: budget.id.toString(),
        action: 'update',
        payload: MealBudgetModel.fromEntity(budget).toJson(),
      );
    }
    if (idx != -1) _items[idx] = budget;
  }

  @override
  Future<void> deleteMealBudget(String id) async {
    final _matches = _items.where((e) => e.id == id);
    final _existing = _matches.isEmpty ? null : _matches.first;
    if (_existing != null) {
      Outbox.instance.enqueue(entity: 'MealBudget', entityId: id.toString(), action: 'delete');
    }
    _items.removeWhere((e) => e.id == id);
  }

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
