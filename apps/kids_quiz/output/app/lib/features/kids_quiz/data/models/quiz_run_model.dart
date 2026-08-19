// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/correct_option.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_category.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/run_status.dart';

class QuizRunModel {
  const QuizRunModel({
    required this.id,
    required this.playerName,
    required this.category,
    required this.q1Answer,
    required this.q2Answer,
    required this.q3Answer,
    required this.status,
  });

  final String id;
  final String playerName;
  final QuizCategory category;
  final CorrectOption q1Answer;
  final CorrectOption q2Answer;
  final CorrectOption q3Answer;
  final RunStatus status;

  factory QuizRunModel.fromJson(Map<String, dynamic> json) => QuizRunModel(
      id: json['id'] as String,
      playerName: json['playerName'] as String,
      category: QuizCategory.values.byName(json['category'] as String),
      q1Answer: CorrectOption.values.byName(json['q1Answer'] as String),
      q2Answer: CorrectOption.values.byName(json['q2Answer'] as String),
      q3Answer: CorrectOption.values.byName(json['q3Answer'] as String),
      status: RunStatus.values.byName(json['status'] as String),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'playerName': playerName,
      'category': category.name,
      'q1Answer': q1Answer.name,
      'q2Answer': q2Answer.name,
      'q3Answer': q3Answer.name,
      'status': status.name,
  };

  QuizRun toEntity() => QuizRun(
    id: id,
    playerName: playerName,
    category: category,
    q1Answer: q1Answer,
    q2Answer: q2Answer,
    q3Answer: q3Answer,
    status: status,
  );

  factory QuizRunModel.fromEntity(QuizRun e) => QuizRunModel(
    id: e.id,
    playerName: e.playerName,
    category: e.category,
    q1Answer: e.q1Answer,
    q2Answer: e.q2Answer,
    q3Answer: e.q3Answer,
    status: e.status,
  );
}
