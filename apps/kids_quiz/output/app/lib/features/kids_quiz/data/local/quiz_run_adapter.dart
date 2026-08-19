// [generated] generator=PersistenceGenerator template=persistence_nosql_hive.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
// Hand-written Hive TypeAdapter for QuizRun (NoSQL persistence, §5.2-F2) — no
// hive_ce_generator codegen required, so this compiles standalone.
import 'package:hive_ce/hive_ce.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_category.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/correct_option.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/run_status.dart';

class QuizRunAdapter extends TypeAdapter<QuizRun> {
  @override
  final int typeId = 2;

  @override
  QuizRun read(BinaryReader reader) {
    final map = reader.readMap().cast<String, dynamic>();
    return QuizRun(
      id: map['id'] as String,
      playerName: map['playerName'] as String,
      category: QuizCategory.values.byName(map['category'] as String),
      q1Answer: CorrectOption.values.byName(map['q1Answer'] as String),
      q2Answer: CorrectOption.values.byName(map['q2Answer'] as String),
      q3Answer: CorrectOption.values.byName(map['q3Answer'] as String),
      status: RunStatus.values.byName(map['status'] as String),
    );
  }

  @override
  void write(BinaryWriter writer, QuizRun obj) {
    writer.writeMap(<String, dynamic>{
      'id': obj.id,
      'playerName': obj.playerName,
      'category': obj.category.name,
      'q1Answer': obj.q1Answer.name,
      'q2Answer': obj.q2Answer.name,
      'q3Answer': obj.q3Answer.name,
      'status': obj.status.name,
    });
  }
}
