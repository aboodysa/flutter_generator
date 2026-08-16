// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_ledgerly/features/auth/domain/usecases/list_users.dart';
import 'package:rasheed_replica_ledgerly/core/no_params.dart';
import 'package:rasheed_replica_ledgerly/features/auth/domain/entities/user.dart';

enum UserListStatus { initial, loading, success, failure }

class UserListState extends Equatable {
  final UserListStatus status;
  final List<User> users;
  final String? errorMessage;

  const UserListState({
    this.status = UserListStatus.initial,
    this.users = const [],
    this.errorMessage,
  });

  UserListState copyWith({
    UserListStatus? status,
    List<User>? users,
    String? errorMessage,
  }) => UserListState(
    status: status ?? this.status,
    users: users ?? this.users,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, users, errorMessage];
}

class UserListCubit extends Cubit<UserListState> {
  final ListUsers _listUsers;
  UserListCubit(this._listUsers) : super(const UserListState());

  Future<void> load() async {
    emit(state.copyWith(status: UserListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listUsers.call(NoParams());
      emit(state.copyWith(status: UserListStatus.success, users: items));
    } catch (e) {
      emit(state.copyWith(status: UserListStatus.failure, errorMessage: e.toString()));
    }
  }
}
