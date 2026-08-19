// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/repositories/achievement_repository.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/achievement.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/badge_kind.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/earned_status.dart';

class AchievementRepositoryInMemoryImpl implements AchievementRepository {
  final List<Achievement> _items = [Achievement(id: 'x', title: 'Sample Achievement', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 0), Achievement(id: 'achievement-1', title: 'Sample Achievement 1', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 1), Achievement(id: 'achievement-2', title: 'Sample Achievement 2', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 2)];

  @override
  Future<List<Achievement>> listAchievements() async => List.unmodifiable(_items);

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
