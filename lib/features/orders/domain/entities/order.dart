import 'package:equatable/equatable.dart';

class Order extends Equatable {
  final String id;
  final String status;
  final double totalAmount;
  final DateTime? createdAt;

  const Order({
    required this.id,
    required this.status,
    required this.totalAmount,
    this.createdAt,
  });

  Order copyWith({
    String? id,
    String? status,
    double? totalAmount,
    DateTime? createdAt,
    bool clearCreatedAt = false,
  }) {
    return Order(
      id: id ?? this.id,
      status: status ?? this.status,
      totalAmount: totalAmount ?? this.totalAmount,
      createdAt: clearCreatedAt ? null : createdAt ?? this.createdAt,
    );
  }

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? '',
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'status': status,
      'totalAmount': totalAmount,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [
        id,
        status,
        totalAmount,
        createdAt,
      ];
}
