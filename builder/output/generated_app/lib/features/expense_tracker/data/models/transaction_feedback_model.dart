// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction_feedback.dart';

class TransactionFeedbackModel {
  const TransactionFeedbackModel({
    required this.reaction,
    required this.comment,
  });

  final String reaction;
  final String comment;

  factory TransactionFeedbackModel.fromJson(Map<String, dynamic> json) => TransactionFeedbackModel(
      reaction: json['reaction'] as String,
      comment: json['comment'] as String,
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'reaction': reaction,
      'comment': comment,
  };

  TransactionFeedback toEntity() => TransactionFeedback(
    reaction: reaction,
    comment: comment,
  );

  factory TransactionFeedbackModel.fromEntity(TransactionFeedback e) => TransactionFeedbackModel(
    reaction: e.reaction,
    comment: e.comment,
  );
}
