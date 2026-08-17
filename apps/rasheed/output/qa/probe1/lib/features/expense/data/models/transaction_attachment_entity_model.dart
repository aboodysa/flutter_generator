// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_expense/features/expense/domain/entities/transaction_attachment_entity.dart';

class TransactionAttachmentEntityModel {
  const TransactionAttachmentEntityModel({
    required this.id,
    required this.transactionEntityId,
    required this.filePath,
    this.fileType,
    required this.createdAt,
  });

  final String id;
  final String transactionEntityId;
  final String filePath;
  final String? fileType;
  final DateTime createdAt;

  factory TransactionAttachmentEntityModel.fromJson(Map<String, dynamic> json) => TransactionAttachmentEntityModel(
      id: json['id'] as String,
      transactionEntityId: json['transactionEntityId'] as String,
      filePath: json['filePath'] as String,
      fileType: json['fileType'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'transactionEntityId': transactionEntityId,
      'filePath': filePath,
      'fileType': fileType,
      'createdAt': createdAt.toIso8601String(),
  };

  TransactionAttachmentEntity toEntity() => TransactionAttachmentEntity(
    id: id,
    transactionEntityId: transactionEntityId,
    filePath: filePath,
    fileType: fileType,
    createdAt: createdAt,
  );

  factory TransactionAttachmentEntityModel.fromEntity(TransactionAttachmentEntity e) => TransactionAttachmentEntityModel(
    id: e.id,
    transactionEntityId: e.transactionEntityId,
    filePath: e.filePath,
    fileType: e.fileType,
    createdAt: e.createdAt,
  );
}
