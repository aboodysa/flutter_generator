import 'package:equatable/equatable.dart';

class Failure extends Equatable {
  final String message;
  final int? code;

  const Failure({
    required this.message,
    this.code,
  });

  Failure copyWith({
    String? message,
    int? code,
    bool clearCode = false,
  }) {
    return Failure(
      message: message ?? this.message,
      code: clearCode ? null : code ?? this.code,
    );
  }

  factory Failure.fromJson(Map<String, dynamic> json) {
    return Failure(
      message: json['message'] as String? ?? '',
      code: json['code'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'message': message,
      'code': code,
    };
  }

  @override
  List<Object?> get props => [
        message,
        code,
      ];
}
