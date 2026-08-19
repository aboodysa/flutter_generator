// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/repositories/quiz_run_repository.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/correct_option.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_category.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/run_status.dart';

class QuizRunRepositoryInMemoryImpl implements QuizRunRepository {
  final List<QuizRun> _items = [QuizRun(id: 'x', playerName: 'x', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first), QuizRun(id: 'quiz-run-1', playerName: 'Sample item 1', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first), QuizRun(id: 'quiz-run-2', playerName: 'Sample item 2', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first)];

  @override
  Future<List<QuizRun>> listQuizRuns() async => List.unmodifiable(_items);

  @override
  Future<QuizRun> createQuizRun(QuizRun quizRun) async {
    _items.add(quizRun);
    return quizRun;
  }

  @override
  Future<void> updateQuizRun(QuizRun quizRun) async {
    final idx = _items.indexWhere((e) => e.id == quizRun.id);
    if (idx != -1) _items[idx] = quizRun;
  }

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
