// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';


class TransactionFeedback extends Equatable {
  const TransactionFeedback({
    required this.reaction,
    required this.comment,
  });

  final String reaction;
  final String comment;

  @override
  List<Object?> get props => const [];
}
