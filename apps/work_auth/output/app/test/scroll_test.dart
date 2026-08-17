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

class _NoOpVisaQuotaRepository implements VisaQuotaRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _SeededVisaQuotaListCubit extends VisaQuotaListCubit {
  _SeededVisaQuotaListCubit() : super(ListVisaQuotas(_NoOpVisaQuotaRepository()));

  @override
  Future<void> load() async {
    emit(state.copyWith(
      status: VisaQuotaListStatus.success,
      visaQuotas: [
        VisaQuota(id: 'visa-quota-1', name: 'Sample VisaQuota 1', limit: Money(minorUnits: 15000, currency: 'VSA'), committed: Money(minorUnits: 15000, currency: 'VSA'), actual: Money(minorUnits: 15000, currency: 'VSA')),
        VisaQuota(id: 'visa-quota-2', name: 'Sample VisaQuota 2', limit: Money(minorUnits: 25000, currency: 'VSA'), committed: Money(minorUnits: 25000, currency: 'VSA'), actual: Money(minorUnits: 25000, currency: 'VSA')),
        VisaQuota(id: 'visa-quota-3', name: 'Sample VisaQuota 3', limit: Money(minorUnits: 35000, currency: 'VSA'), committed: Money(minorUnits: 35000, currency: 'VSA'), actual: Money(minorUnits: 35000, currency: 'VSA')),
        VisaQuota(id: 'visa-quota-4', name: 'Sample VisaQuota 4', limit: Money(minorUnits: 45000, currency: 'VSA'), committed: Money(minorUnits: 45000, currency: 'VSA'), actual: Money(minorUnits: 45000, currency: 'VSA')),
        VisaQuota(id: 'visa-quota-5', name: 'Sample VisaQuota 5', limit: Money(minorUnits: 55000, currency: 'VSA'), committed: Money(minorUnits: 55000, currency: 'VSA'), actual: Money(minorUnits: 55000, currency: 'VSA')),
        VisaQuota(id: 'visa-quota-6', name: 'Sample VisaQuota 6', limit: Money(minorUnits: 65000, currency: 'VSA'), committed: Money(minorUnits: 65000, currency: 'VSA'), actual: Money(minorUnits: 65000, currency: 'VSA')),
        VisaQuota(id: 'visa-quota-7', name: 'Sample VisaQuota 7', limit: Money(minorUnits: 75000, currency: 'VSA'), committed: Money(minorUnits: 75000, currency: 'VSA'), actual: Money(minorUnits: 75000, currency: 'VSA')),
        VisaQuota(id: 'visa-quota-8', name: 'Sample VisaQuota 8', limit: Money(minorUnits: 85000, currency: 'VSA'), committed: Money(minorUnits: 85000, currency: 'VSA'), actual: Money(minorUnits: 85000, currency: 'VSA')),
        VisaQuota(id: 'visa-quota-9', name: 'Sample VisaQuota 9', limit: Money(minorUnits: 95000, currency: 'VSA'), committed: Money(minorUnits: 95000, currency: 'VSA'), actual: Money(minorUnits: 95000, currency: 'VSA')),
        VisaQuota(id: 'visa-quota-10', name: 'Sample VisaQuota 10', limit: Money(minorUnits: 105000, currency: 'VSA'), committed: Money(minorUnits: 105000, currency: 'VSA'), actual: Money(minorUnits: 105000, currency: 'VSA')),
        VisaQuota(id: 'visa-quota-11', name: 'Sample VisaQuota 11', limit: Money(minorUnits: 115000, currency: 'VSA'), committed: Money(minorUnits: 115000, currency: 'VSA'), actual: Money(minorUnits: 115000, currency: 'VSA')),
        VisaQuota(id: 'visa-quota-12', name: 'Sample VisaQuota 12', limit: Money(minorUnits: 125000, currency: 'VSA'), committed: Money(minorUnits: 125000, currency: 'VSA'), actual: Money(minorUnits: 125000, currency: 'VSA')),
        VisaQuota(id: 'visa-quota-13', name: 'Sample VisaQuota 13', limit: Money(minorUnits: 135000, currency: 'VSA'), committed: Money(minorUnits: 135000, currency: 'VSA'), actual: Money(minorUnits: 135000, currency: 'VSA')),
        VisaQuota(id: 'visa-quota-14', name: 'Sample VisaQuota 14', limit: Money(minorUnits: 145000, currency: 'VSA'), committed: Money(minorUnits: 145000, currency: 'VSA'), actual: Money(minorUnits: 145000, currency: 'VSA')),
        VisaQuota(id: 'visa-quota-15', name: 'Sample VisaQuota 15', limit: Money(minorUnits: 155000, currency: 'VSA'), committed: Money(minorUnits: 155000, currency: 'VSA'), actual: Money(minorUnits: 155000, currency: 'VSA')),
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
    // P2: same reasoning as the riverpod branch above — scrollUntilVisible tolerates a
    // searchable screen's shorter list viewport instead of gambling on one fixed-magnitude drag.
    await tester.scrollUntilVisible(find.byKey(const ValueKey('work-auth-15')), 300.0, scrollable: find.descendant(of: find.byType(ListView), matching: find.byType(Scrollable)));
    expect(find.byKey(const ValueKey('work-auth-15')), findsOneWidget, reason: 'row 15 should be reachable after scrolling');
  });

  testWidgets('VisaQuotaListScreen: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<VisaQuotaListCubit>(
      create: (_) => _SeededVisaQuotaListCubit()..load(),
      child: MaterialApp.router(theme: buildTheme(), routerConfig: GoRouter(initialLocation: '/', routes: [GoRoute(path: '/', builder: (_, __) => const VisaQuotaListScreen())])),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('visa-quota-15')), findsNothing, reason: 'row 15 should be off-screen before scrolling');
    // P2: same reasoning as the riverpod branch above — scrollUntilVisible tolerates a
    // searchable screen's shorter list viewport instead of gambling on one fixed-magnitude drag.
    await tester.scrollUntilVisible(find.byKey(const ValueKey('visa-quota-15')), 300.0, scrollable: find.descendant(of: find.byType(ListView), matching: find.byType(Scrollable)));
    expect(find.byKey(const ValueKey('visa-quota-15')), findsOneWidget, reason: 'row 15 should be reachable after scrolling');
  });
}
