// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: AnswerAcceptable
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/pick.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/answer_option.dart';

class AnswerAcceptable {
  bool evaluate(Pick e) {
    return (e.answer == AnswerOption.a ||
        e.answer == AnswerOption.b);
  }
}
