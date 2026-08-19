// [generated] generator=ScreenGenerator template=screen_wizard_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_kids_quiz/core/components.dart';
import 'package:rasheed_replica_kids_quiz/core/theme.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/presentation/state/quiz_run_wizard.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/correct_option.dart';

import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/policy/quiz_run_policy.dart';

import 'package:rasheed_replica_kids_quiz/core/app_strings.dart';

class QuizRunWizardScreen extends StatefulWidget {
  const QuizRunWizardScreen({super.key});

  @override
  State<QuizRunWizardScreen> createState() => _QuizRunWizardScreenState();
}

class _QuizRunWizardScreenState extends State<QuizRunWizardScreen> {
  final _playerNameFocus = FocusNode();
  @override
  void dispose() {
    _playerNameFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Quiz Runs')),
      body: BlocBuilder<QuizRunWizardCubit, QuizRunWizardState>(
        builder: (context, state) {

            if (state.wizardStatus == QuizRunWizardStatus.success) return const Center(child: Text('All done!'));
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                LinearProgressIndicator(value: (state.currentStep + 1) / 6),
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.lg, AppSpacing.md, AppSpacing.md),
                  child: Text(
                    switch (state.currentStep) {
                      0 => 'Let\'s play! What\'s your name?',
                      1 => 'Q1: Which planet is known as the Red Planet? A) Earth  B) Mars  C) Venus  D) Jupiter',
                      2 => 'Q2: Which animal says \'Moo\'? A) Cow  B) Cat  C) Dog  D) Duck',
                      3 => 'Q3: What color do you get by mixing blue and yellow? A) Purple  B) Green  C) Orange  D) Pink',
                      4 => 'Perfect score! Bonus round unlocked!',
                      5 => 'Your Results',
                      _ => '',
                    },
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                    child: switch (state.currentStep) {
                      0 => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                        TextFormField(key: const ValueKey('field-playerName'), focusNode: _playerNameFocus, onTap: () => _playerNameFocus.requestFocus(), initialValue: state.playerName ?? '', decoration: const InputDecoration(labelText: 'Player Name'), onChanged: (v) => context.read<QuizRunWizardCubit>().setPlayerName(v)),
                      ]),
                      1 => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Player Name: ${(state.playerName?.toString() ?? '—')}'),
                        Wrap(key: const ValueKey('field-q1Answer'), spacing: AppSpacing.sm, children: CorrectOption.values.map((v) => ChoiceChip(label: Text(v.name), selected: state.q1Answer == v, selectedColor: AppChip.colorForTone(context, AppChipTone.neutral).withValues(alpha: 0.2), onSelected: (_) => context.read<QuizRunWizardCubit>().setQ1Answer(v))).toList()),
                      ]),
                      2 => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Player Name: ${(state.playerName?.toString() ?? '—')}'),
                        Text('Q1 Answer: ${(state.q1Answer?.name ?? '—')}'),
                        Wrap(key: const ValueKey('field-q2Answer'), spacing: AppSpacing.sm, children: CorrectOption.values.map((v) => ChoiceChip(label: Text(v.name), selected: state.q2Answer == v, selectedColor: AppChip.colorForTone(context, AppChipTone.neutral).withValues(alpha: 0.2), onSelected: (_) => context.read<QuizRunWizardCubit>().setQ2Answer(v))).toList()),
                      ]),
                      3 => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Player Name: ${(state.playerName?.toString() ?? '—')}'),
                        Text('Q1 Answer: ${(state.q1Answer?.name ?? '—')}'),
                        Text('Q2 Answer: ${(state.q2Answer?.name ?? '—')}'),
                        Wrap(key: const ValueKey('field-q3Answer'), spacing: AppSpacing.sm, children: CorrectOption.values.map((v) => ChoiceChip(label: Text(v.name), selected: state.q3Answer == v, selectedColor: AppChip.colorForTone(context, AppChipTone.neutral).withValues(alpha: 0.2), onSelected: (_) => context.read<QuizRunWizardCubit>().setQ3Answer(v))).toList()),
                      ]),
                      4 => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Player Name: ${(state.playerName?.toString() ?? '—')}'),
                        Text('Q1 Answer: ${(state.q1Answer?.name ?? '—')}'),
                        Text('Q2 Answer: ${(state.q2Answer?.name ?? '—')}'),
                        Text('Q3 Answer: ${(state.q3Answer?.name ?? '—')}'),
                      ]),
                      5 => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Builder(builder: (context) {
                          final gamifiedVerdicts = evaluateQuizRunPolicy(state.draft).where((v) => const {'Question1Correct', 'Question2Correct', 'Question3Correct'}.contains(v.ruleId)).toList();
                          final gamifiedPoints = gamifiedVerdicts.fold<int>(0, (sum, v) => sum + (const {'Question1Correct': 5, 'Question2Correct': 5, 'Question3Correct': 5}[v.ruleId] ?? 0));
                          final gamifiedStars = List.filled(gamifiedVerdicts.length, '⭐').join();
                          return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text('$gamifiedStars  (${gamifiedVerdicts.length}/3)', style: Theme.of(context).textTheme.headlineMedium),
                            Text('Score: $gamifiedPoints ⭐', style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: AppSpacing.sm),
                            Wrap(spacing: AppSpacing.sm, runSpacing: AppSpacing.sm, children: [
                          gamifiedVerdicts.any((v) => v.ruleId == 'Question1Correct') ? const AppChip(label: 'Correct! +5 ⭐', tone: AppChipTone.success) : const AppChip(label: '✗', tone: AppChipTone.neutral),
                          gamifiedVerdicts.any((v) => v.ruleId == 'Question2Correct') ? const AppChip(label: 'Correct! +5 ⭐', tone: AppChipTone.success) : const AppChip(label: '✗', tone: AppChipTone.neutral),
                          gamifiedVerdicts.any((v) => v.ruleId == 'Question3Correct') ? const AppChip(label: 'Correct! +5 ⭐', tone: AppChipTone.success) : const AppChip(label: '✗', tone: AppChipTone.neutral),
                            ]),
                            const SizedBox(height: AppSpacing.sm),
                          ]);
                        }),
                        Text('Player Name: ${(state.playerName?.toString() ?? '—')}'),
                        Text('Q1 Answer: ${(state.q1Answer?.name ?? '—')}'),
                        Text('Q2 Answer: ${(state.q2Answer?.name ?? '—')}'),
                        Text('Q3 Answer: ${(state.q3Answer?.name ?? '—')}'),
                      ]),
                      _ => const SizedBox(),
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Row(
                    children: [
                      if (state.currentStep > 0)
                        TextButton(onPressed: () => context.read<QuizRunWizardCubit>().back(), child: Text(AppStrings.of(context).back)),
                      const Spacer(),
                      PrimaryButton(
                        label: state.isLastStep ? 'Finish' : 'Next',
                        onPressed: state.canAdvance
                            ? () {
                                if (state.isLastStep) {
                                  context.read<QuizRunWizardCubit>().finish();
                                } else {
                                  context.read<QuizRunWizardCubit>().next();
                                }
                              }
                            : null,
                      ),
                    ],
                  ),
                ),
              ],
            );
        },
      ),
    );
  }
}
