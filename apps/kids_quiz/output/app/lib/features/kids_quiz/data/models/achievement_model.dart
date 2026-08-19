// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/achievement.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/badge_kind.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/earned_status.dart';

class AchievementModel {
  const AchievementModel({
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

  factory AchievementModel.fromJson(Map<String, dynamic> json) => AchievementModel(
      id: json['id'] as String,
      title: json['title'] as String,
      kind: BadgeKind.values.byName(json['kind'] as String),
      earned: EarnedStatus.values.byName(json['earned'] as String),
      points: json['points'] as int? ?? 0,
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'title': title,
      'kind': kind.name,
      'earned': earned.name,
      'points': points,
  };

  Achievement toEntity() => Achievement(
    id: id,
    title: title,
    kind: kind,
    earned: earned,
    points: points,
  );

  factory AchievementModel.fromEntity(Achievement e) => AchievementModel(
    id: e.id,
    title: e.title,
    kind: e.kind,
    earned: e.earned,
    points: e.points,
  );
}
