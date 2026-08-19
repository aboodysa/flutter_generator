// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/answer_option.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/mood_option.dart';

class Pick extends Equatable {
  const Pick({
    required this.id,
    required this.label,
    required this.answer,
    required this.mood,
  });

  final String id;
  final String label;
  final AnswerOption answer;
  final MoodOption mood;

  @override
  List<Object?> get props => [id, label, answer, mood];
}
