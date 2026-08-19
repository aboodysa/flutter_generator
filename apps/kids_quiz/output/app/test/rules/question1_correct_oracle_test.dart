// [generated] generator=RuleOracleTestGenerator template=oracle_test.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR + Question1Correct.oracle.json.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_kids_quiz/generated.dart';

void main() {
  test('case 1: expected true', () {
    final e = QuizRun(id: 'r-1', playerName: 'Lina', category: QuizCategory.space, q1Answer: CorrectOption.b, q2Answer: CorrectOption.a, q3Answer: CorrectOption.b, status: RunStatus.values.first);
    expect(Question1Correct().evaluate(e), equals(true));
  });

  test('case 2: expected false', () {
    final e = QuizRun(id: 'r-2', playerName: 'Omar', category: QuizCategory.animals, q1Answer: CorrectOption.a, q2Answer: CorrectOption.a, q3Answer: CorrectOption.b, status: RunStatus.values.first);
    expect(Question1Correct().evaluate(e), equals(false));
  });

  test('case 3: expected false', () {
    final e = QuizRun(id: 'r-3', playerName: 'Sara', category: QuizCategory.colors, q1Answer: CorrectOption.c, q2Answer: CorrectOption.b, q3Answer: CorrectOption.d, status: RunStatus.values.first);
    expect(Question1Correct().evaluate(e), equals(false));
  });

  test('case 4: expected true', () {
    final e = QuizRun(id: 'r-4', playerName: 'Yousef', category: QuizCategory.body, q1Answer: CorrectOption.b, q2Answer: CorrectOption.c, q3Answer: CorrectOption.a, status: RunStatus.values.first);
    expect(Question1Correct().evaluate(e), equals(true));
  });
}
