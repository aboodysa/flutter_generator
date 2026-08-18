// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_keemart/features/keemart/domain/usecases/list_products.dart';
import 'package:rasheed_replica_keemart/core/no_params.dart';
import 'package:rasheed_replica_keemart/features/keemart/domain/entities/product.dart';

enum HomeStatus { initial, loading, success, failure }

class HomeState extends Equatable {
  final HomeStatus status;
  final List<Product> products;
  final String? errorMessage;

  const HomeState({
    this.status = HomeStatus.initial,
    this.products = const [],
    this.errorMessage,
  });

  HomeState copyWith({
    HomeStatus? status,
    List<Product>? products,
    String? errorMessage,
  }) => HomeState(
    status: status ?? this.status,
    products: products ?? this.products,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, products, errorMessage];
}

class HomeCubit extends Cubit<HomeState> {
  final ListProducts _listProducts;
  HomeCubit(this._listProducts) : super(const HomeState());

  Future<void> load() async {
    emit(state.copyWith(status: HomeStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listProducts.call(NoParams());
      emit(state.copyWith(status: HomeStatus.success, products: items));
    } catch (e) {
      emit(state.copyWith(status: HomeStatus.failure, errorMessage: e.toString()));
    }
  }
}
