// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/auth/domain/entities/user.dart';
import 'package:rasheed_replica_ledgerly/features/auth/domain/entities/user_role.dart';

class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
  });

  final String id;
  final String name;
  final String email;
  final UserRole role;

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      role: UserRole.values.byName(json['role'] as String),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'name': name,
      'email': email,
      'role': role.name,
  };

  User toEntity() => User(
    id: id,
    name: name,
    email: email,
    role: role,
  );

  factory UserModel.fromEntity(User e) => UserModel(
    id: e.id,
    name: e.name,
    email: e.email,
    role: e.role,
  );
}
