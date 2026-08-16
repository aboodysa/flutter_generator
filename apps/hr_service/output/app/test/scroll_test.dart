// [generated] generator=ScrollTestGenerator template=scroll_test_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_hr_service/generated.dart';
import 'package:rasheed_replica_hr_service/core/theme.dart';

class _NoOpLeaveRequestRepository implements LeaveRequestRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _SeededLeaveRequestListCubit extends LeaveRequestListCubit {
  _SeededLeaveRequestListCubit() : super(ListLeaveRequests(_NoOpLeaveRequestRepository()));

  @override
  Future<void> load() async {
    emit(state.copyWith(
      status: LeaveRequestListStatus.success,
      leaveRequests: [
        LeaveRequest(id: 'leave-request-1', name: 'Sample LeaveRequest 1', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 1, status: LeaveStatus.values.first, reason: 'Sample item 1', exported: false),
        LeaveRequest(id: 'leave-request-2', name: 'Sample LeaveRequest 2', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 2, status: LeaveStatus.values.first, reason: 'Sample item 2', exported: false),
        LeaveRequest(id: 'leave-request-3', name: 'Sample LeaveRequest 3', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 3, status: LeaveStatus.values.first, reason: 'Sample item 3', exported: false),
        LeaveRequest(id: 'leave-request-4', name: 'Sample LeaveRequest 4', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 4, status: LeaveStatus.values.first, reason: 'Sample item 4', exported: false),
        LeaveRequest(id: 'leave-request-5', name: 'Sample LeaveRequest 5', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 5, status: LeaveStatus.values.first, reason: 'Sample item 5', exported: false),
        LeaveRequest(id: 'leave-request-6', name: 'Sample LeaveRequest 6', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 6, status: LeaveStatus.values.first, reason: 'Sample item 6', exported: false),
        LeaveRequest(id: 'leave-request-7', name: 'Sample LeaveRequest 7', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 7, status: LeaveStatus.values.first, reason: 'Sample item 7', exported: false),
        LeaveRequest(id: 'leave-request-8', name: 'Sample LeaveRequest 8', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 8, status: LeaveStatus.values.first, reason: 'Sample item 8', exported: false),
        LeaveRequest(id: 'leave-request-9', name: 'Sample LeaveRequest 9', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 9, status: LeaveStatus.values.first, reason: 'Sample item 9', exported: false),
        LeaveRequest(id: 'leave-request-10', name: 'Sample LeaveRequest 10', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 10, status: LeaveStatus.values.first, reason: 'Sample item 10', exported: false),
        LeaveRequest(id: 'leave-request-11', name: 'Sample LeaveRequest 11', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 11, status: LeaveStatus.values.first, reason: 'Sample item 11', exported: false),
        LeaveRequest(id: 'leave-request-12', name: 'Sample LeaveRequest 12', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 12, status: LeaveStatus.values.first, reason: 'Sample item 12', exported: false),
        LeaveRequest(id: 'leave-request-13', name: 'Sample LeaveRequest 13', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 13, status: LeaveStatus.values.first, reason: 'Sample item 13', exported: false),
        LeaveRequest(id: 'leave-request-14', name: 'Sample LeaveRequest 14', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 14, status: LeaveStatus.values.first, reason: 'Sample item 14', exported: false),
        LeaveRequest(id: 'leave-request-15', name: 'Sample LeaveRequest 15', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 15, status: LeaveStatus.values.first, reason: 'Sample item 15', exported: false),
      ],
    ));
  }
}

class _NoOpApprovalRepository implements ApprovalRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _SeededApprovalListCubit extends ApprovalListCubit {
  _SeededApprovalListCubit() : super(ListApprovals(_NoOpApprovalRepository()));

  @override
  Future<void> load() async {
    emit(state.copyWith(
      status: ApprovalListStatus.success,
      approvals: [
        Approval(id: 'approval-1', leaveRequestId: 'Sample item 1', approver: 'Sample item 1', note: 'Sample item 1', decidedAt: DateTime(2025)),
        Approval(id: 'approval-2', leaveRequestId: 'Sample item 2', approver: 'Sample item 2', note: 'Sample item 2', decidedAt: DateTime(2025)),
        Approval(id: 'approval-3', leaveRequestId: 'Sample item 3', approver: 'Sample item 3', note: 'Sample item 3', decidedAt: DateTime(2025)),
        Approval(id: 'approval-4', leaveRequestId: 'Sample item 4', approver: 'Sample item 4', note: 'Sample item 4', decidedAt: DateTime(2025)),
        Approval(id: 'approval-5', leaveRequestId: 'Sample item 5', approver: 'Sample item 5', note: 'Sample item 5', decidedAt: DateTime(2025)),
        Approval(id: 'approval-6', leaveRequestId: 'Sample item 6', approver: 'Sample item 6', note: 'Sample item 6', decidedAt: DateTime(2025)),
        Approval(id: 'approval-7', leaveRequestId: 'Sample item 7', approver: 'Sample item 7', note: 'Sample item 7', decidedAt: DateTime(2025)),
        Approval(id: 'approval-8', leaveRequestId: 'Sample item 8', approver: 'Sample item 8', note: 'Sample item 8', decidedAt: DateTime(2025)),
        Approval(id: 'approval-9', leaveRequestId: 'Sample item 9', approver: 'Sample item 9', note: 'Sample item 9', decidedAt: DateTime(2025)),
        Approval(id: 'approval-10', leaveRequestId: 'Sample item 10', approver: 'Sample item 10', note: 'Sample item 10', decidedAt: DateTime(2025)),
        Approval(id: 'approval-11', leaveRequestId: 'Sample item 11', approver: 'Sample item 11', note: 'Sample item 11', decidedAt: DateTime(2025)),
        Approval(id: 'approval-12', leaveRequestId: 'Sample item 12', approver: 'Sample item 12', note: 'Sample item 12', decidedAt: DateTime(2025)),
        Approval(id: 'approval-13', leaveRequestId: 'Sample item 13', approver: 'Sample item 13', note: 'Sample item 13', decidedAt: DateTime(2025)),
        Approval(id: 'approval-14', leaveRequestId: 'Sample item 14', approver: 'Sample item 14', note: 'Sample item 14', decidedAt: DateTime(2025)),
        Approval(id: 'approval-15', leaveRequestId: 'Sample item 15', approver: 'Sample item 15', note: 'Sample item 15', decidedAt: DateTime(2025)),
      ],
    ));
  }
}

void main() {
  testWidgets('LeaveRequestListScreen: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<LeaveRequestListCubit>(
      create: (_) => _SeededLeaveRequestListCubit()..load(),
      child: MaterialApp.router(theme: buildTheme(), routerConfig: GoRouter(initialLocation: '/', routes: [GoRoute(path: '/', builder: (_, __) => const LeaveRequestListScreen())])),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('leave-request-15')), findsNothing, reason: 'row 15 should be off-screen before scrolling');
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('leave-request-15')), findsOneWidget, reason: 'row 15 should be reachable after dragging up');
  });

  testWidgets('ApprovalListScreen: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<ApprovalListCubit>(
      create: (_) => _SeededApprovalListCubit()..load(),
      child: MaterialApp.router(theme: buildTheme(), routerConfig: GoRouter(initialLocation: '/', routes: [GoRoute(path: '/', builder: (_, __) => const ApprovalListScreen())])),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('approval-15')), findsNothing, reason: 'row 15 should be off-screen before scrolling');
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('approval-15')), findsOneWidget, reason: 'row 15 should be reachable after dragging up');
  });
}
