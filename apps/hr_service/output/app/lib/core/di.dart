// [generated] generator=DIGenerator template=di_get_it.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/data/repositories/leave_request_repository_in_memory_impl.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/data/repositories/approval_repository_in_memory_impl.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/repositories/leave_request_repository.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/repositories/approval_repository.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/list_leave_requests.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/get_leave_request.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/create_leave_request.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/update_leave_request.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/delete_leave_request.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/list_approvals.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/get_approval.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/create_approval.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/update_approval.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/delete_approval.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/state/leave_request_list.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/state/approval_list.dart';

final sl = GetIt.instance;

void setupDependencies() {
  sl.registerLazySingleton<LeaveRequestRepository>(() => LeaveRequestRepositoryInMemoryImpl());
  sl.registerLazySingleton<ApprovalRepository>(() => ApprovalRepositoryInMemoryImpl());
  sl.registerLazySingleton<ListLeaveRequests>(() => ListLeaveRequests(sl<LeaveRequestRepository>()));
  sl.registerLazySingleton<GetLeaveRequest>(() => GetLeaveRequest(sl<LeaveRequestRepository>()));
  sl.registerLazySingleton<CreateLeaveRequest>(() => CreateLeaveRequest(sl<LeaveRequestRepository>()));
  sl.registerLazySingleton<UpdateLeaveRequest>(() => UpdateLeaveRequest(sl<LeaveRequestRepository>()));
  sl.registerLazySingleton<DeleteLeaveRequest>(() => DeleteLeaveRequest(sl<LeaveRequestRepository>()));
  sl.registerLazySingleton<ListApprovals>(() => ListApprovals(sl<ApprovalRepository>()));
  sl.registerLazySingleton<GetApproval>(() => GetApproval(sl<ApprovalRepository>()));
  sl.registerLazySingleton<CreateApproval>(() => CreateApproval(sl<ApprovalRepository>()));
  sl.registerLazySingleton<UpdateApproval>(() => UpdateApproval(sl<ApprovalRepository>()));
  sl.registerLazySingleton<DeleteApproval>(() => DeleteApproval(sl<ApprovalRepository>()));
  sl.registerFactory<LeaveRequestListCubit>(() => LeaveRequestListCubit(sl<ListLeaveRequests>(), sl<CreateLeaveRequest>(), sl<UpdateLeaveRequest>(), sl<DeleteLeaveRequest>()));
  sl.registerFactory<ApprovalListCubit>(() => ApprovalListCubit(sl<ListApprovals>(), sl<CreateApproval>(), sl<UpdateApproval>(), sl<DeleteApproval>()));
}
