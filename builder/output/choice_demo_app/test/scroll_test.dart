// [generated] generator=ScrollTestGenerator template=scroll_test_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_choice_demo/generated.dart';
import 'package:rasheed_replica_choice_demo/core/theme.dart';

class _NoOpPickRepository implements PickRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _SeededPickListCubit extends PickListCubit {
  _SeededPickListCubit() : super(ListPicks(_NoOpPickRepository()));

  @override
  Future<void> load() async {
    emit(state.copyWith(
      status: PickListStatus.success,
      picks: [
        Pick(id: 'pick-1', label: 'Sample Pick 1', answer: AnswerOption.values.first, mood: MoodOption.values.first),
        Pick(id: 'pick-2', label: 'Sample Pick 2', answer: AnswerOption.values.first, mood: MoodOption.values.first),
        Pick(id: 'pick-3', label: 'Sample Pick 3', answer: AnswerOption.values.first, mood: MoodOption.values.first),
        Pick(id: 'pick-4', label: 'Sample Pick 4', answer: AnswerOption.values.first, mood: MoodOption.values.first),
        Pick(id: 'pick-5', label: 'Sample Pick 5', answer: AnswerOption.values.first, mood: MoodOption.values.first),
        Pick(id: 'pick-6', label: 'Sample Pick 6', answer: AnswerOption.values.first, mood: MoodOption.values.first),
        Pick(id: 'pick-7', label: 'Sample Pick 7', answer: AnswerOption.values.first, mood: MoodOption.values.first),
        Pick(id: 'pick-8', label: 'Sample Pick 8', answer: AnswerOption.values.first, mood: MoodOption.values.first),
        Pick(id: 'pick-9', label: 'Sample Pick 9', answer: AnswerOption.values.first, mood: MoodOption.values.first),
        Pick(id: 'pick-10', label: 'Sample Pick 10', answer: AnswerOption.values.first, mood: MoodOption.values.first),
        Pick(id: 'pick-11', label: 'Sample Pick 11', answer: AnswerOption.values.first, mood: MoodOption.values.first),
        Pick(id: 'pick-12', label: 'Sample Pick 12', answer: AnswerOption.values.first, mood: MoodOption.values.first),
        Pick(id: 'pick-13', label: 'Sample Pick 13', answer: AnswerOption.values.first, mood: MoodOption.values.first),
        Pick(id: 'pick-14', label: 'Sample Pick 14', answer: AnswerOption.values.first, mood: MoodOption.values.first),
        Pick(id: 'pick-15', label: 'Sample Pick 15', answer: AnswerOption.values.first, mood: MoodOption.values.first),
      ],
    ));
  }
}

void main() {
  testWidgets('PickListScreen: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<PickListCubit>(
      create: (_) => _SeededPickListCubit()..load(),
      child: MaterialApp.router(theme: buildTheme(), routerConfig: GoRouter(initialLocation: '/', routes: [GoRoute(path: '/', builder: (_, __) => const PickListScreen())])),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('pick-15')), findsNothing, reason: 'row 15 should be off-screen before scrolling');
    // P2: same reasoning as the riverpod branch above — scrollUntilVisible tolerates a
    // searchable screen's shorter list viewport instead of gambling on one fixed-magnitude drag.
    await tester.scrollUntilVisible(find.byKey(const ValueKey('pick-15')), 300.0, scrollable: find.descendant(of: find.byType(ListView), matching: find.byType(Scrollable)));
    expect(find.byKey(const ValueKey('pick-15')), findsOneWidget, reason: 'row 15 should be reachable after scrolling');
  });
}
