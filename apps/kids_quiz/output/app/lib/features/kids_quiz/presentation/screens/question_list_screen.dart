// [generated] generator=ScreenGenerator template=screen_sections_bloc_search.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_kids_quiz/core/components.dart';
import 'package:rasheed_replica_kids_quiz/core/theme.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/presentation/state/question_list.dart';




class QuestionListScreen extends StatefulWidget {
  const QuestionListScreen({super.key});

  @override
  State<QuestionListScreen> createState() => _QuestionListScreenState();
}

class _QuestionListScreenState extends State<QuestionListScreen> {
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
      appBar: AppBar(title: Text('Questions', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: AppType.titleWeightStrong))),
      body: BlocBuilder<QuestionListCubit, QuestionListState>(
        builder: (context, state) {
        if (state.status == QuestionListStatus.loading) return const LoadingState();
        if (state.status == QuestionListStatus.failure) return ErrorState(message: state.errorMessage);
            final query = _query.trim().toLowerCase();
            final filtered = query.isEmpty ? state.questions : state.questions.where((item) => (item.title).toLowerCase().contains(query)).toList();
            return ListView(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
              children: [
              Padding(key: ValueKey('section-search'), padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, 0), child: SearchBar(controller: _searchController, focusNode: _searchFocus, onTap: () => _searchFocus.requestFocus(), hintText: 'Search Questions', leading: const Icon(Icons.search), onChanged: (v) => setState(() => _query = v), shape: WidgetStatePropertyAll(RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.roundedSearch))))),
              const SizedBox(height: AppSpacing.lg),
              Padding(key: ValueKey('section-primaryHero'), padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.lg), child: AppHeroBanner(headline: 'Let\'s Play & Learn!', compact: false, radius: AppRadius.roundedSurface)),
              const SizedBox(height: AppSpacing.lg),
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
                        child: AppListCard(card: false, title: Text(item.title), subtitle: Text(''), radius: AppRadius.roundedSurface, contentPadding: EdgeInsets.all(AppSpacing.lg)),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Column(key: ValueKey('section-allQuestions'), crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Padding(key: ValueKey('section-allQuestionsHeader'), padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, AppSpacing.xs), child: Text('All Questions', style: Theme.of(context).textTheme.titleMedium)),
                Padding(
                  key: ValueKey('section-allQuestionsGrid'),
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  child: state.questions.isEmpty
                      ? EmptyState(message: 'No Questions yet')
                      : filtered.isEmpty && query.isNotEmpty
                          ? EmptyState(message: 'No results for "$_query"')
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
                        price: '',
                        oldPrice: null,
                        stockLabel: null,
                        stockTone: null,
                        onAdd: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Added ${item.title} to cart'))), radius: AppRadius.roundedSurface,
                      );
                    },
                  ),
                ),
              ]),
              const SizedBox(height: AppSpacing.lg),
              Padding(key: ValueKey('section-allQuestionsDivider'), padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs), child: const Divider()),
              ],
            );
        },
      ),
    );
  }
}
