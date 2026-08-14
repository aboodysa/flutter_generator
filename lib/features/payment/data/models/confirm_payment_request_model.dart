import 'package:equatable/equatable.dart';

class ConfirmPaymentRequest extends Equatable {
  final String inspectionId;
  final String paymentMethod;

  const ConfirmPaymentRequest({
    required this.inspectionId,
    required this.paymentMethod,
  });

  ConfirmPaymentRequest copyWith({
    String? inspectionId,
    String? paymentMethod,
  }) {
    return ConfirmPaymentRequest(
      inspectionId: inspectionId ?? this.inspectionId,
      paymentMethod: paymentMethod ?? this.paymentMethod,
    );
  }

  factory ConfirmPaymentRequest.fromJson(Map<String, dynamic> json) {
    return ConfirmPaymentRequest(
      inspectionId: json['inspectionId'] as String? ?? '',
      paymentMethod: json['paymentMethod'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'inspectionId': inspectionId,
      'paymentMethod': paymentMethod,
    };
  }

  @override
  List<Object?> get props => [
        inspectionId,
        paymentMethod,
      ];
}
