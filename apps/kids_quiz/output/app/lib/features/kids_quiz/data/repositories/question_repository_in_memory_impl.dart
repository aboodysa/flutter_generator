// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/repositories/question_repository.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/correct_option.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/question.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_category.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_difficulty.dart';

class QuestionRepositoryInMemoryImpl implements QuestionRepository {
  final List<Question> _items = [Question(id: 'x', title: 'Sample Question', category: QuizCategory.values.first, difficulty: QuizDifficulty.values.first, answerA: 'x', answerB: 'x', answerC: 'x', answerD: 'x', correct: CorrectOption.values.first, explanation: 'x', points: 0), Question(id: 'question-1', title: 'Sample Question 1', category: QuizCategory.values.first, difficulty: QuizDifficulty.values.first, answerA: 'Sample item 1', answerB: 'Sample item 1', answerC: 'Sample item 1', answerD: 'Sample item 1', correct: CorrectOption.values.first, explanation: 'Sample item 1', points: 1), Question(id: 'question-2', title: 'Sample Question 2', category: QuizCategory.values.first, difficulty: QuizDifficulty.values.first, answerA: 'Sample item 2', answerB: 'Sample item 2', answerC: 'Sample item 2', answerD: 'Sample item 2', correct: CorrectOption.values.first, explanation: 'Sample item 2', points: 2)];

  @override
  Future<List<Question>> listQuestions() async => List.unmodifiable(_items);

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
