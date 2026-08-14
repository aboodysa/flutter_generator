// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';


class TransactionAttachment extends Equatable {
  const TransactionAttachment({
    required this.id,
    required this.filePath,
    this.fileType,
  });

  final String id;
  final String filePath;
  final String? fileType;

  @override
  List<Object?> get props => [id];
}
