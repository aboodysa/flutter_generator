// [generated] generator=DIGenerator template=di_get_it.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/data/repositories/question_repository_in_memory_impl.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/data/repositories/achievement_repository_in_memory_impl.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/data/repositories/quiz_run_repository_in_memory_impl.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/repositories/question_repository.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/repositories/achievement_repository.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/repositories/quiz_run_repository.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/usecases/list_questions.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/usecases/list_achievements.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/usecases/list_quiz_runs.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/usecases/create_quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/usecases/update_quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/presentation/state/question_list.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/presentation/state/achievement_list.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/presentation/state/quiz_run_list.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/presentation/state/quiz_run_wizard.dart';

final sl = GetIt.instance;

void setupDependencies() {
  sl.registerLazySingleton<QuestionRepository>(() => QuestionRepositoryInMemoryImpl());
  sl.registerLazySingleton<AchievementRepository>(() => AchievementRepositoryInMemoryImpl());
  sl.registerLazySingleton<QuizRunRepository>(() => QuizRunRepositoryInMemoryImpl());
  sl.registerLazySingleton<ListQuestions>(() => ListQuestions(sl<QuestionRepository>()));
  sl.registerLazySingleton<ListAchievements>(() => ListAchievements(sl<AchievementRepository>()));
  sl.registerLazySingleton<ListQuizRuns>(() => ListQuizRuns(sl<QuizRunRepository>()));
  sl.registerLazySingleton<CreateQuizRun>(() => CreateQuizRun(sl<QuizRunRepository>()));
  sl.registerLazySingleton<UpdateQuizRun>(() => UpdateQuizRun(sl<QuizRunRepository>()));
  sl.registerFactory<QuestionListCubit>(() => QuestionListCubit(sl<ListQuestions>()));
  sl.registerFactory<AchievementListCubit>(() => AchievementListCubit(sl<ListAchievements>()));
  sl.registerFactory<QuizRunListCubit>(() => QuizRunListCubit(sl<ListQuizRuns>(), sl<CreateQuizRun>(), sl<UpdateQuizRun>()));
  sl.registerFactory<QuizRunWizardCubit>(() => QuizRunWizardCubit(sl<CreateQuizRun>()));
}
