// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/achievement.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/repositories/achievement_repository.dart';
import 'package:rasheed_replica_kids_quiz/core/no_params.dart';

class ListAchievements {
  final AchievementRepository repository;
  const ListAchievements(this.repository);

  Future<List<Achievement>> call(NoParams params) => repository.listAchievements();

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
