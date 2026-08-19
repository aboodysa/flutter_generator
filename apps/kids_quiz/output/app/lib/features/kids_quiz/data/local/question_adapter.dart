// [generated] generator=PersistenceGenerator template=persistence_nosql_hive.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
// Hand-written Hive TypeAdapter for Question (NoSQL persistence, §5.2-F2) — no
// hive_ce_generator codegen required, so this compiles standalone.
import 'package:hive_ce/hive_ce.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/question.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_category.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_difficulty.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/correct_option.dart';

class QuestionAdapter extends TypeAdapter<Question> {
  @override
  final int typeId = 0;

  @override
  Question read(BinaryReader reader) {
    final map = reader.readMap().cast<String, dynamic>();
    return Question(
      id: map['id'] as String,
      title: map['title'] as String,
      category: QuizCategory.values.byName(map['category'] as String),
      difficulty: QuizDifficulty.values.byName(map['difficulty'] as String),
      answerA: map['answerA'] as String,
      answerB: map['answerB'] as String,
      answerC: map['answerC'] as String,
      answerD: map['answerD'] as String,
      correct: CorrectOption.values.byName(map['correct'] as String),
      explanation: map['explanation'] as String,
      points: map['points'] as int,
    );
  }

  @override
  void write(BinaryWriter writer, Question obj) {
    writer.writeMap(<String, dynamic>{
      'id': obj.id,
      'title': obj.title,
      'category': obj.category.name,
      'difficulty': obj.difficulty.name,
      'answerA': obj.answerA,
      'answerB': obj.answerB,
      'answerC': obj.answerC,
      'answerD': obj.answerD,
      'correct': obj.correct.name,
      'explanation': obj.explanation,
      'points': obj.points,
    });
  }
}
