// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: NeedsManagerReview
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/work_auth.dart';


class NeedsManagerReview {
  bool evaluate(WorkAuth e) {
    return e.durationDays > 60;
  }
}
