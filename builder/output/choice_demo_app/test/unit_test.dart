// [generated] generator=UnitTestGenerator template=unit_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_choice_demo/generated.dart';

void main() {
  test('PickModel fromJson/toJson round-trips without throwing', () {
    final json = <String, dynamic>{
        'id': 'x',
        'label': 'x',
        'answer': 'a',
        'mood': 'happy',
    };
    final m = PickModel.fromJson(json);
    expect(m.toJson(), isNotEmpty);
  });

  test('Pick equality by identity', () {
    final a = Pick(id: 'x', label: 'x', answer: AnswerOption.values.first, mood: MoodOption.values.first);
    expect(a, equals(a));
  });
}
