// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/achievement.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/usecases/list_achievements.dart';
import 'package:rasheed_replica_kids_quiz/core/no_params.dart';

enum AchievementListStatus { initial, loading, success, failure }

class AchievementListState extends Equatable {
  final AchievementListStatus status;
  final List<Achievement> achievements;
  final String? errorMessage;

  const AchievementListState({
    this.status = AchievementListStatus.initial,
    this.achievements = const [],
    this.errorMessage,
  });

  AchievementListState copyWith({
    AchievementListStatus? status,
    List<Achievement>? achievements,
    String? errorMessage,
  }) => AchievementListState(
    status: status ?? this.status,
    achievements: achievements ?? this.achievements,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, achievements, errorMessage];
}

class AchievementListCubit extends Cubit<AchievementListState> {
  final ListAchievements _listAchievements;
  AchievementListCubit(this._listAchievements) : super(const AchievementListState());

  Future<void> load() async {
    emit(state.copyWith(status: AchievementListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listAchievements.call(NoParams());
      emit(state.copyWith(status: AchievementListStatus.success, achievements: items));
    } catch (e) {
      emit(state.copyWith(status: AchievementListStatus.failure, errorMessage: e.toString()));
    }
  }
}
