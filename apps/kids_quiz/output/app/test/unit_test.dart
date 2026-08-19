// [generated] generator=UnitTestGenerator template=unit_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_kids_quiz/generated.dart';

void main() {
  test('QuestionModel fromJson/toJson round-trips without throwing', () {
    final json = <String, dynamic>{
        'id': 'x',
        'title': 'x',
        'category': 'animals',
        'difficulty': 'easy',
        'answerA': 'x',
        'answerB': 'x',
        'answerC': 'x',
        'answerD': 'x',
        'correct': 'a',
        'explanation': 'x',
        'points': 0,
    };
    final m = QuestionModel.fromJson(json);
    expect(m.toJson(), isNotEmpty);
  });

  test('Question equality by identity', () {
    final a = Question(id: 'x', title: 'x', category: QuizCategory.values.first, difficulty: QuizDifficulty.values.first, answerA: 'x', answerB: 'x', answerC: 'x', answerD: 'x', correct: CorrectOption.values.first, explanation: 'x', points: 0);
    expect(a, equals(a));
  });
}
