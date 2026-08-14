// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/product.dart';
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/product_filter.dart';
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/stock_status.dart';
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/unit.dart';

enum ProductListStatus { initial, loading, success, failure }

class ProductListState extends Equatable {
  final ProductListStatus status;
  final List<Product> transactions;
  final String? errorMessage;
  final ProductFilter filter;

  const ProductListState({
    this.status = ProductListStatus.initial,
    this.transactions = const [],
    this.errorMessage,
    this.filter = const ProductFilter(),
  });

  ProductListState copyWith({
    ProductListStatus? status,
    List<Product>? transactions,
    String? errorMessage,
    ProductFilter? filter,
  }) => ProductListState(
    status: status ?? this.status,
    transactions: transactions ?? this.transactions,
    errorMessage: errorMessage,
    filter: filter ?? this.filter,
  );

  @override
  List<Object?> get props => [status, transactions, errorMessage, filter];
}

class ProductListCubit extends Cubit<ProductListState> {
  ProductListCubit() : super(const ProductListState());

  Future<void> load() async {
    emit(state.copyWith(status: ProductListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      // Deterministic demo data so the app renders rows out of the box:
      emit(state.copyWith(status: ProductListStatus.success, transactions: [Product(id: 'x', name: 'x', sku: 'x', price: 0.0, quantity: 0, unit: Unit.values.first, status: StockStatus.values.first)]));
    } catch (e) {
      emit(state.copyWith(status: ProductListStatus.failure, errorMessage: e.toString()));
    }
  }
}
