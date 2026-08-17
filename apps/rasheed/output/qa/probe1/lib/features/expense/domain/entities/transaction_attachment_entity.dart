// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';


class TransactionAttachmentEntity extends Equatable {
  const TransactionAttachmentEntity({
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

  @override
  List<Object?> get props => [id];
}
