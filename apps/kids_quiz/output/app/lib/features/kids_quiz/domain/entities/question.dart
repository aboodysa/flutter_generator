// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/correct_option.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_category.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_difficulty.dart';

class Question extends Equatable {
  const Question({
    required this.id,
    required this.title,
    required this.category,
    required this.difficulty,
    required this.answerA,
    required this.answerB,
    required this.answerC,
    required this.answerD,
    required this.correct,
    required this.explanation,
    required this.points,
  });

  final String id;
  final String title;
  final QuizCategory category;
  final QuizDifficulty difficulty;
  final String answerA;
  final String answerB;
  final String answerC;
  final String answerD;
  final CorrectOption correct;
  final String explanation;
  final int points;

  @override
  List<Object?> get props => [id];
}
