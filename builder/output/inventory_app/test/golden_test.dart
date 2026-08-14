// [generated] generator=GoldenTestGenerator template=golden.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_inventory/generated.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('ProductListScreen renders (golden)', (tester) async {
    await tester.pumpWidget(BlocProvider<ProductListCubit>(
      create: (_) => ProductListCubit(),
      child: const MaterialApp(home: ProductListScreen()),
    ));
    await expectLater(find.byType(ProductListScreen), matchesGoldenFile('goldens/product_list_screen.png'));
  });
}
