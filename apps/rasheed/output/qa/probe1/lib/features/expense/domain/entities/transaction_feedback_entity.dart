// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';


class TransactionFeedbackEntity extends Equatable {
  const TransactionFeedbackEntity({
    required this.feedbackCode,
    required this.snapshotCode,
    required this.reaction,
    required this.comment,
  });

  final String feedbackCode;
  final String snapshotCode;
  final String reaction;
  final String comment;

  @override
  List<Object?> get props => const [];
}
