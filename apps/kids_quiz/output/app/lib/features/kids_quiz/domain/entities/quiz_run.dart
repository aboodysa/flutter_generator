// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/correct_option.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_category.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/run_status.dart';

class QuizRun extends Equatable {
  const QuizRun({
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

  @override
  List<Object?> get props => [id, playerName, category, q1Answer, q2Answer, q3Answer, status];
}
