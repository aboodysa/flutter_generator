// [generated] generator=StateMachineGenerator template=state_machine.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
enum TransactionApprovalStatus {
  draft,
  submitted,
  approved,
  rejected
}

enum TransactionApprovalEvent {
  submit,
  approve,
  reject
}

class TransactionApprovalStateMachine {
  /// Returns the next state, or null if the transition is illegal.
  static TransactionApprovalStatus? transition(TransactionApprovalStatus from, TransactionApprovalEvent event) {
    switch (from) {
      case TransactionApprovalStatus.draft:
        if (event == TransactionApprovalEvent.submit) return TransactionApprovalStatus.submitted;
        return null;
      case TransactionApprovalStatus.submitted:
        if (event == TransactionApprovalEvent.approve) return TransactionApprovalStatus.approved; // guard: isManager
        if (event == TransactionApprovalEvent.reject) return TransactionApprovalStatus.rejected;
        return null;
      case TransactionApprovalStatus.approved:
        return null; // terminal / no outgoing transitions
      case TransactionApprovalStatus.rejected:
        return null; // terminal / no outgoing transitions
    }
  }
}
