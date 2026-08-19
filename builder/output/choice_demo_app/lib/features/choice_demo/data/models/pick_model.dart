// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/answer_option.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/mood_option.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/pick.dart';

class PickModel {
  const PickModel({
    required this.id,
    required this.label,
    required this.answer,
    required this.mood,
  });

  final String id;
  final String label;
  final AnswerOption answer;
  final MoodOption mood;

  factory PickModel.fromJson(Map<String, dynamic> json) => PickModel(
      id: json['id'] as String,
      label: json['label'] as String,
      answer: AnswerOption.values.byName(json['answer'] as String),
      mood: MoodOption.values.byName(json['mood'] as String),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'label': label,
      'answer': answer.name,
      'mood': mood.name,
  };

  Pick toEntity() => Pick(
    id: id,
    label: label,
    answer: answer,
    mood: mood,
  );

  factory PickModel.fromEntity(Pick e) => PickModel(
    id: e.id,
    label: e.label,
    answer: e.answer,
    mood: e.mood,
  );
}
