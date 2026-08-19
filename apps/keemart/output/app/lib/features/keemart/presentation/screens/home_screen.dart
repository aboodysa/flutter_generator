// [generated] generator=ScreenGenerator template=screen_sections_bloc_search.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_keemart/core/components.dart';
import 'package:rasheed_replica_keemart/core/theme.dart';
import 'package:rasheed_replica_keemart/features/keemart/presentation/state/home.dart';




class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _searchController = TextEditingController();
  final _searchFocus = FocusNode();
  String _query = '';
  @override
  void dispose() {
    _searchController.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Products', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: AppType.titleWeightStrong))),
      body: BlocBuilder<HomeCubit, HomeState>(
        builder: (context, state) {
        if (state.status == HomeStatus.loading) return const LoadingState();
        if (state.status == HomeStatus.failure) return ErrorState(message: state.errorMessage);
            final query = _query.trim().toLowerCase();
            final filtered = query.isEmpty ? state.products : state.products.where((item) => (item.title).toLowerCase().contains(query)).toList();
            return ListView(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
              children: [
              Padding(key: ValueKey('section-search'), padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, 0), child: SearchBar(controller: _searchController, focusNode: _searchFocus, onTap: () => _searchFocus.requestFocus(), hintText: 'Search Products', leading: const Icon(Icons.search), onChanged: (v) => setState(() => _query = v), shape: WidgetStatePropertyAll(RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.roundedSearch))))),
              const SizedBox(height: AppSpacing.md),
              Padding(key: ValueKey('section-primaryHero'), padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.md), child: AppHeroBanner(headline: 'Ready For School', compact: false, radius: AppRadius.roundedSurface)),
              const SizedBox(height: AppSpacing.md),
              SizedBox(
                key: ValueKey('section-discover'),
                height: AppTokens.cardHeight,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  itemCount: filtered.length,
                  itemBuilder: (context, i) {
                    final item = filtered[i];
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
              Column(key: ValueKey('section-offers'), crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Padding(key: ValueKey('section-offersHeader'), padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, AppSpacing.xs), child: Text('Weekly offers', style: Theme.of(context).textTheme.titleMedium)),
                Padding(
                  key: ValueKey('section-offersGrid'),
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  child: state.products.isEmpty
                      ? EmptyState(message: 'No Products yet')
                      : filtered.isEmpty && query.isNotEmpty
                          ? EmptyState(message: 'No results for "\$_query"')
                          : GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: AppTokens.gridExtent,
                      mainAxisExtent: AppTokens.cardHeight,
                      crossAxisSpacing: AppSpacing.sm,
                      mainAxisSpacing: AppSpacing.sm,
                    ),
                    itemCount: filtered.length,
                    itemBuilder: (context, i) {
                      final item = filtered[i];
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
              Padding(key: ValueKey('section-offersDivider'), padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs), child: const Divider()),
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
