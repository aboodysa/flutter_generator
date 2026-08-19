// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/correct_option.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/question.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_category.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_difficulty.dart';

class QuestionModel {
  const QuestionModel({
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

  factory QuestionModel.fromJson(Map<String, dynamic> json) => QuestionModel(
      id: json['id'] as String,
      title: json['title'] as String,
      category: QuizCategory.values.byName(json['category'] as String),
      difficulty: QuizDifficulty.values.byName(json['difficulty'] as String),
      answerA: json['answerA'] as String,
      answerB: json['answerB'] as String,
      answerC: json['answerC'] as String,
      answerD: json['answerD'] as String,
      correct: CorrectOption.values.byName(json['correct'] as String),
      explanation: json['explanation'] as String,
      points: json['points'] as int? ?? 5,
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'title': title,
      'category': category.name,
      'difficulty': difficulty.name,
      'answerA': answerA,
      'answerB': answerB,
      'answerC': answerC,
      'answerD': answerD,
      'correct': correct.name,
      'explanation': explanation,
      'points': points,
  };

  Question toEntity() => Question(
    id: id,
    title: title,
    category: category,
    difficulty: difficulty,
    answerA: answerA,
    answerB: answerB,
    answerC: answerC,
    answerD: answerD,
    correct: correct,
    explanation: explanation,
    points: points,
  );

  factory QuestionModel.fromEntity(Question e) => QuestionModel(
    id: e.id,
    title: e.title,
    category: e.category,
    difficulty: e.difficulty,
    answerA: e.answerA,
    answerB: e.answerB,
    answerC: e.answerC,
    answerD: e.answerD,
    correct: e.correct,
    explanation: e.explanation,
    points: e.points,
  );
}
