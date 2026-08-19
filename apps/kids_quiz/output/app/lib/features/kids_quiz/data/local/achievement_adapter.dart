// [generated] generator=PersistenceGenerator template=persistence_nosql_hive.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
// Hand-written Hive TypeAdapter for Achievement (NoSQL persistence, §5.2-F2) — no
// hive_ce_generator codegen required, so this compiles standalone.
import 'package:hive_ce/hive_ce.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/achievement.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/badge_kind.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/earned_status.dart';

class AchievementAdapter extends TypeAdapter<Achievement> {
  @override
  final int typeId = 1;

  @override
  Achievement read(BinaryReader reader) {
    final map = reader.readMap().cast<String, dynamic>();
    return Achievement(
      id: map['id'] as String,
      title: map['title'] as String,
      kind: BadgeKind.values.byName(map['kind'] as String),
      earned: EarnedStatus.values.byName(map['earned'] as String),
      points: map['points'] as int,
    );
  }

  @override
  void write(BinaryWriter writer, Achievement obj) {
    writer.writeMap(<String, dynamic>{
      'id': obj.id,
      'title': obj.title,
      'kind': obj.kind.name,
      'earned': obj.earned.name,
      'points': obj.points,
    });
  }
}
