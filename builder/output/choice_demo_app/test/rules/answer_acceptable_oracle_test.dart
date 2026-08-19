// [generated] generator=RuleOracleTestGenerator template=oracle_test.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR + AnswerAcceptable.oracle.json.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_choice_demo/generated.dart';

void main() {
  test('case 1: expected true', () {
    final e = Pick(id: 'p-1', label: 'First', answer: AnswerOption.a, mood: MoodOption.happy);
    expect(AnswerAcceptable().evaluate(e), equals(true));
  });

  test('case 2: expected true', () {
    final e = Pick(id: 'p-2', label: 'Second', answer: AnswerOption.b, mood: MoodOption.happy);
    expect(AnswerAcceptable().evaluate(e), equals(true));
  });

  test('case 3: expected false', () {
    final e = Pick(id: 'p-3', label: 'Third', answer: AnswerOption.c, mood: MoodOption.sad);
    expect(AnswerAcceptable().evaluate(e), equals(false));
  });
}
