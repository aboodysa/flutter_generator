// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';


class Approval extends Equatable {
  const Approval({
    required this.id,
    required this.leaveRequestId,
    required this.approver,
    this.note,
    this.decidedAt,
  });

  final String id;
  final String leaveRequestId;
  final String approver;
  final String? note;
  final DateTime? decidedAt;

  @override
  List<Object?> get props => [id, leaveRequestId, approver, note, decidedAt];
}
