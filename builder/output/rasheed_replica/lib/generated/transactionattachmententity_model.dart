// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'transactionattachmententity.dart';

class TransactionAttachmentEntityModel {
  const TransactionAttachmentEntityModel({
    required this.id,
    required this.transactionId,
    required this.filePath,
    this.fileType,
    required this.createdAt,
  });

  final String id;
  final String transactionId;
  final String filePath;
  final String? fileType;
  final DateTime createdAt;

  factory TransactionAttachmentEntityModel.fromJson(Map<String, dynamic> json) => TransactionAttachmentEntityModel(
      id: json['id'] as String,
      transactionId: json['transactionId'] as String,
      filePath: json['filePath'] as String,
      fileType: json['fileType'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'transactionId': transactionId,
      'filePath': filePath,
      'fileType': fileType,
      'createdAt': createdAt.toIso8601String(),
  };

  TransactionAttachmentEntity toEntity() => TransactionAttachmentEntity(
    id: id,
    transactionId: transactionId,
    filePath: filePath,
    fileType: fileType,
    createdAt: createdAt,
  );

  factory TransactionAttachmentEntityModel.fromEntity(TransactionAttachmentEntity e) => TransactionAttachmentEntityModel(
    id: e.id,
    transactionId: e.transactionId,
    filePath: e.filePath,
    fileType: e.fileType,
    createdAt: e.createdAt,
  );
}
