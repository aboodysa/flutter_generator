// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'transactionfeedbackentity.dart';

class TransactionFeedbackEntityModel {
  const TransactionFeedbackEntityModel({
    required this.feedbackCode,
    required this.snapshotCode,
    required this.reaction,
    required this.comment,
  });

  final String feedbackCode;
  final String snapshotCode;
  final String reaction;
  final String comment;

  factory TransactionFeedbackEntityModel.fromJson(Map<String, dynamic> json) => TransactionFeedbackEntityModel(
      feedbackCode: json['feedbackCode'] as String,
      snapshotCode: json['snapshotCode'] as String,
      reaction: json['reaction'] as String,
      comment: json['comment'] as String,
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'feedbackCode': feedbackCode,
      'snapshotCode': snapshotCode,
      'reaction': reaction,
      'comment': comment,
  };

  TransactionFeedbackEntity toEntity() => TransactionFeedbackEntity(
    feedbackCode: feedbackCode,
    snapshotCode: snapshotCode,
    reaction: reaction,
    comment: comment,
  );

  factory TransactionFeedbackEntityModel.fromEntity(TransactionFeedbackEntity e) => TransactionFeedbackEntityModel(
    feedbackCode: e.feedbackCode,
    snapshotCode: e.snapshotCode,
    reaction: e.reaction,
    comment: e.comment,
  );
}
