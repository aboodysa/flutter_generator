// [generated] generator=ScreenGenerator template=screen_list.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_inventory/features/inventory/presentation/state/product_list.dart';

class ProductListScreen extends StatelessWidget {
  const ProductListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ProductListScreen')),
      body: BlocBuilder<ProductListCubit, ProductListState>(
        builder: (context, state) {
          if (state.status == ProductListStatus.loading) return const Center(child: CircularProgressIndicator());
            return ListView.builder(
              itemCount: state.transactions.length,
              itemBuilder: (_, i) => ListTile(title: Text(state.transactions[i].toString())),
            );
        },
      ),
    );
  }
}
