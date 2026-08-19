// [generated] generator=ScrollTestGenerator template=scroll_test_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_kids_quiz/generated.dart';
import 'package:rasheed_replica_kids_quiz/core/theme.dart';

class _NoOpAchievementRepository implements AchievementRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _SeededAchievementListCubit extends AchievementListCubit {
  _SeededAchievementListCubit() : super(ListAchievements(_NoOpAchievementRepository()));

  @override
  Future<void> load() async {
    emit(state.copyWith(
      status: AchievementListStatus.success,
      achievements: [
        Achievement(id: 'achievement-1', title: 'Sample Achievement 1', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 1),
        Achievement(id: 'achievement-2', title: 'Sample Achievement 2', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 2),
        Achievement(id: 'achievement-3', title: 'Sample Achievement 3', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 3),
        Achievement(id: 'achievement-4', title: 'Sample Achievement 4', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 4),
        Achievement(id: 'achievement-5', title: 'Sample Achievement 5', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 5),
        Achievement(id: 'achievement-6', title: 'Sample Achievement 6', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 6),
        Achievement(id: 'achievement-7', title: 'Sample Achievement 7', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 7),
        Achievement(id: 'achievement-8', title: 'Sample Achievement 8', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 8),
        Achievement(id: 'achievement-9', title: 'Sample Achievement 9', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 9),
        Achievement(id: 'achievement-10', title: 'Sample Achievement 10', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 10),
        Achievement(id: 'achievement-11', title: 'Sample Achievement 11', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 11),
        Achievement(id: 'achievement-12', title: 'Sample Achievement 12', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 12),
        Achievement(id: 'achievement-13', title: 'Sample Achievement 13', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 13),
        Achievement(id: 'achievement-14', title: 'Sample Achievement 14', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 14),
        Achievement(id: 'achievement-15', title: 'Sample Achievement 15', kind: BadgeKind.values.first, earned: EarnedStatus.values.first, points: 15),
      ],
    ));
  }
}

class _NoOpQuizRunRepository implements QuizRunRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _SeededQuizRunListCubit extends QuizRunListCubit {
  _SeededQuizRunListCubit() : super(ListQuizRuns(_NoOpQuizRunRepository()));

  @override
  Future<void> load() async {
    emit(state.copyWith(
      status: QuizRunListStatus.success,
      quizRuns: [
        QuizRun(id: 'quiz-run-1', playerName: 'Sample item 1', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first),
        QuizRun(id: 'quiz-run-2', playerName: 'Sample item 2', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first),
        QuizRun(id: 'quiz-run-3', playerName: 'Sample item 3', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first),
        QuizRun(id: 'quiz-run-4', playerName: 'Sample item 4', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first),
        QuizRun(id: 'quiz-run-5', playerName: 'Sample item 5', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first),
        QuizRun(id: 'quiz-run-6', playerName: 'Sample item 6', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first),
        QuizRun(id: 'quiz-run-7', playerName: 'Sample item 7', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first),
        QuizRun(id: 'quiz-run-8', playerName: 'Sample item 8', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first),
        QuizRun(id: 'quiz-run-9', playerName: 'Sample item 9', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first),
        QuizRun(id: 'quiz-run-10', playerName: 'Sample item 10', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first),
        QuizRun(id: 'quiz-run-11', playerName: 'Sample item 11', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first),
        QuizRun(id: 'quiz-run-12', playerName: 'Sample item 12', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first),
        QuizRun(id: 'quiz-run-13', playerName: 'Sample item 13', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first),
        QuizRun(id: 'quiz-run-14', playerName: 'Sample item 14', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first),
        QuizRun(id: 'quiz-run-15', playerName: 'Sample item 15', category: QuizCategory.values.first, q1Answer: CorrectOption.values.first, q2Answer: CorrectOption.values.first, q3Answer: CorrectOption.values.first, status: RunStatus.values.first),
      ],
    ));
  }
}

void main() {
  testWidgets('AchievementListScreen: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<AchievementListCubit>(
      create: (_) => _SeededAchievementListCubit()..load(),
      child: MaterialApp.router(theme: buildTheme(), routerConfig: GoRouter(initialLocation: '/', routes: [GoRoute(path: '/', builder: (_, __) => const AchievementListScreen())])),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('achievement-15')), findsNothing, reason: 'row 15 should be off-screen before scrolling');
    // P2: same reasoning as the riverpod branch above — scrollUntilVisible tolerates a
    // searchable screen's shorter list viewport instead of gambling on one fixed-magnitude drag.
    await tester.scrollUntilVisible(find.byKey(const ValueKey('achievement-15')), 300.0, scrollable: find.descendant(of: find.byType(ListView), matching: find.byType(Scrollable)));
    expect(find.byKey(const ValueKey('achievement-15')), findsOneWidget, reason: 'row 15 should be reachable after scrolling');
  });

  testWidgets('QuizRunListScreen: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<QuizRunListCubit>(
      create: (_) => _SeededQuizRunListCubit()..load(),
      child: MaterialApp.router(theme: buildTheme(), routerConfig: GoRouter(initialLocation: '/', routes: [GoRoute(path: '/', builder: (_, __) => const QuizRunListScreen())])),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('quiz-run-15')), findsNothing, reason: 'row 15 should be off-screen before scrolling');
    // P2: same reasoning as the riverpod branch above — scrollUntilVisible tolerates a
    // searchable screen's shorter list viewport instead of gambling on one fixed-magnitude drag.
    await tester.scrollUntilVisible(find.byKey(const ValueKey('quiz-run-15')), 300.0, scrollable: find.descendant(of: find.byType(ListView), matching: find.byType(Scrollable)));
    expect(find.byKey(const ValueKey('quiz-run-15')), findsOneWidget, reason: 'row 15 should be reachable after scrolling');
  });
}
