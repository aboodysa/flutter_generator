// [generated] generator=ScreenGenerator template=screen_sections_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_keemart/core/components.dart';
import 'package:rasheed_replica_keemart/core/theme.dart';
import 'package:rasheed_replica_keemart/features/keemart/presentation/state/home.dart';




class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Products', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: AppType.titleWeightStrong))),
      body: BlocBuilder<HomeCubit, HomeState>(
        builder: (context, state) {
        if (state.status == HomeStatus.loading) return const LoadingState();
        if (state.status == HomeStatus.failure) return ErrorState(message: state.errorMessage);
            return ListView(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
              children: [
              Padding(padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, 0), child: SearchBar(hintText: 'Search Products', leading: const Icon(Icons.search))),
              const SizedBox(height: AppSpacing.md),
              Padding(padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.md), child: AppHeroBanner(headline: 'Ready For School', compact: false, radius: AppRadius.roundedSurface)),
              const SizedBox(height: AppSpacing.md),
              SizedBox(
                height: AppTokens.cardHeight,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  itemCount: state.products.length,
                  itemBuilder: (context, i) {
                    final item = state.products[i];
                    return Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.sm),
                      child: SizedBox(
                        width: AppTokens.cardWidth,
                        child: AppListCard(card: true, title: Text(item.title), subtitle: Text(item.price.format()), radius: AppRadius.roundedSurface, contentPadding: EdgeInsets.all(AppSpacing.md)),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Padding(padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, AppSpacing.xs), child: Text('Weekly offers', style: Theme.of(context).textTheme.titleMedium)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  child: GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: AppTokens.gridExtent,
                      mainAxisExtent: AppTokens.cardHeight,
                      crossAxisSpacing: AppSpacing.sm,
                      mainAxisSpacing: AppSpacing.sm,
                    ),
                    itemCount: state.products.length,
                    itemBuilder: (context, i) {
                      final item = state.products[i];
                      return AppProductCard(
                        title: item.title,
                        price: item.price.format(),
                        oldPrice: item.oldPrice?.format(),
                        stockLabel: item.status.name,
                        stockTone: AppChip.toneForStatus(item.status.name),
                        onAdd: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Added ${item.title} to cart'))), radius: AppRadius.roundedSurface,
                      );
                    },
                  ),
                ),
              ]),
              const SizedBox(height: AppSpacing.md),
              const Padding(padding: EdgeInsets.symmetric(vertical: AppSpacing.xs), child: Divider()),
              ],
            );
        },
      ),
      floatingActionButton: Padding(
        padding: EdgeInsets.all(AppSpacing.md),
        child: FloatingActionButton(
        tooltip: 'Cart',
        onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cart is empty'))),
        child: const Icon(Icons.shopping_cart), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.roundedFab)),
      ),
      ),
    );
  }
}
