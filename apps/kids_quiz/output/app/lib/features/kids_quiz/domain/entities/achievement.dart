// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/badge_kind.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/earned_status.dart';

class Achievement extends Equatable {
  const Achievement({
    required this.id,
    required this.title,
    required this.kind,
    required this.earned,
    required this.points,
  });

  final String id;
  final String title;
  final BadgeKind kind;
  final EarnedStatus earned;
  final int points;

  @override
  List<Object?> get props => [id];
}
