// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: LongLeave
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_request.dart';


class LongLeave {
  bool evaluate(LeaveRequest e) {
    return e.days > 10;
  }
}
