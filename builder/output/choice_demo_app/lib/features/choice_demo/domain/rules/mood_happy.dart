// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: MoodHappy
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/pick.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/mood_option.dart';

class MoodHappy {
  bool evaluate(Pick e) {
    return e.mood == MoodOption.happy;
  }
}
