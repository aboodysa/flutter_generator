// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction_attachment.dart';

class TransactionAttachmentModel {
  const TransactionAttachmentModel({
    required this.id,
    required this.filePath,
    this.fileType,
  });

  final String id;
  final String filePath;
  final String? fileType;

  factory TransactionAttachmentModel.fromJson(Map<String, dynamic> json) => TransactionAttachmentModel(
      id: json['id'] as String,
      filePath: json['filePath'] as String,
      fileType: json['fileType'] as String?,
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'filePath': filePath,
      'fileType': fileType,
  };

  TransactionAttachment toEntity() => TransactionAttachment(
    id: id,
    filePath: filePath,
    fileType: fileType,
  );

  factory TransactionAttachmentModel.fromEntity(TransactionAttachment e) => TransactionAttachmentModel(
    id: e.id,
    filePath: e.filePath,
    fileType: e.fileType,
  );
}
