// [generated] generator=ScrollTestGenerator template=scroll_test_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_work_auth/generated.dart';
import 'package:rasheed_replica_work_auth/core/theme.dart';

class _NoOpWorkAuthRepository implements WorkAuthRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _SeededWorkAuthListCubit extends WorkAuthListCubit {
  _SeededWorkAuthListCubit() : super(ListWorkAuths(_NoOpWorkAuthRepository()));

  @override
  Future<void> load() async {
    emit(state.copyWith(
      status: WorkAuthListStatus.success,
      workAuths: [
        WorkAuth(id: 'work-auth-1', name: 'Sample WorkAuth 1', country: 'Sample item 1', jobTitle: 'Sample item 1', startDate: DateTime(2025), durationDays: 1, status: WorkAuthStatus.values.first),
        WorkAuth(id: 'work-auth-2', name: 'Sample WorkAuth 2', country: 'Sample item 2', jobTitle: 'Sample item 2', startDate: DateTime(2025), durationDays: 2, status: WorkAuthStatus.values.first),
        WorkAuth(id: 'work-auth-3', name: 'Sample WorkAuth 3', country: 'Sample item 3', jobTitle: 'Sample item 3', startDate: DateTime(2025), durationDays: 3, status: WorkAuthStatus.values.first),
        WorkAuth(id: 'work-auth-4', name: 'Sample WorkAuth 4', country: 'Sample item 4', jobTitle: 'Sample item 4', startDate: DateTime(2025), durationDays: 4, status: WorkAuthStatus.values.first),
        WorkAuth(id: 'work-auth-5', name: 'Sample WorkAuth 5', country: 'Sample item 5', jobTitle: 'Sample item 5', startDate: DateTime(2025), durationDays: 5, status: WorkAuthStatus.values.first),
        WorkAuth(id: 'work-auth-6', name: 'Sample WorkAuth 6', country: 'Sample item 6', jobTitle: 'Sample item 6', startDate: DateTime(2025), durationDays: 6, status: WorkAuthStatus.values.first),
        WorkAuth(id: 'work-auth-7', name: 'Sample WorkAuth 7', country: 'Sample item 7', jobTitle: 'Sample item 7', startDate: DateTime(2025), durationDays: 7, status: WorkAuthStatus.values.first),
        WorkAuth(id: 'work-auth-8', name: 'Sample WorkAuth 8', country: 'Sample item 8', jobTitle: 'Sample item 8', startDate: DateTime(2025), durationDays: 8, status: WorkAuthStatus.values.first),
        WorkAuth(id: 'work-auth-9', name: 'Sample WorkAuth 9', country: 'Sample item 9', jobTitle: 'Sample item 9', startDate: DateTime(2025), durationDays: 9, status: WorkAuthStatus.values.first),
        WorkAuth(id: 'work-auth-10', name: 'Sample WorkAuth 10', country: 'Sample item 10', jobTitle: 'Sample item 10', startDate: DateTime(2025), durationDays: 10, status: WorkAuthStatus.values.first),
        WorkAuth(id: 'work-auth-11', name: 'Sample WorkAuth 11', country: 'Sample item 11', jobTitle: 'Sample item 11', startDate: DateTime(2025), durationDays: 11, status: WorkAuthStatus.values.first),
        WorkAuth(id: 'work-auth-12', name: 'Sample WorkAuth 12', country: 'Sample item 12', jobTitle: 'Sample item 12', startDate: DateTime(2025), durationDays: 12, status: WorkAuthStatus.values.first),
        WorkAuth(id: 'work-auth-13', name: 'Sample WorkAuth 13', country: 'Sample item 13', jobTitle: 'Sample item 13', startDate: DateTime(2025), durationDays: 13, status: WorkAuthStatus.values.first),
        WorkAuth(id: 'work-auth-14', name: 'Sample WorkAuth 14', country: 'Sample item 14', jobTitle: 'Sample item 14', startDate: DateTime(2025), durationDays: 14, status: WorkAuthStatus.values.first),
        WorkAuth(id: 'work-auth-15', name: 'Sample WorkAuth 15', country: 'Sample item 15', jobTitle: 'Sample item 15', startDate: DateTime(2025), durationDays: 15, status: WorkAuthStatus.values.first),
      ],
    ));
  }
}

void main() {
  testWidgets('WorkAuthListScreen: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<WorkAuthListCubit>(
      create: (_) => _SeededWorkAuthListCubit()..load(),
      child: MaterialApp.router(theme: buildTheme(), routerConfig: GoRouter(initialLocation: '/', routes: [GoRoute(path: '/', builder: (_, __) => const WorkAuthListScreen())])),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('work-auth-15')), findsNothing, reason: 'row 15 should be off-screen before scrolling');
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('work-auth-15')), findsOneWidget, reason: 'row 15 should be reachable after dragging up');
  });
}
