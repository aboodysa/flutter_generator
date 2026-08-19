// [generated] generator=ScreenGenerator template=screen_wizard_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_choice_demo/core/components.dart';
import 'package:rasheed_replica_choice_demo/core/theme.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/presentation/state/pick_wizard.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/answer_option.dart';

import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/policy/pick_policy.dart';


class PickWizardScreen extends StatelessWidget {
  const PickWizardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Picks')),
      body: BlocBuilder<PickWizardCubit, PickWizardState>(
        builder: (context, state) {

            if (state.wizardStatus == PickWizardStatus.success) return const Center(child: Text('All done!'));
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                LinearProgressIndicator(value: (state.currentStep + 1) / 2),
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.lg, AppSpacing.md, AppSpacing.md),
                  child: Text(
                    switch (state.currentStep) {
                      0 => 'Pick one',
                      1 => 'Done',
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
                        Wrap(key: const ValueKey('field-answer'), spacing: AppSpacing.sm, children: AnswerOption.values.map((v) => ChoiceChip(label: Text(v.name), selected: state.answer == v, selectedColor: AppChip.colorForTone(context, AppChipTone.neutral).withValues(alpha: 0.2), onSelected: (_) => context.read<PickWizardCubit>().setAnswer(v))).toList()),
                      ]),
                      1 => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Builder(builder: (context) {
                          final _verdicts = evaluatePickPolicy(state.draft).where((v) => const {'AnswerCorrect'}.contains(v.ruleId)).toList();
                          final _points = _verdicts.fold<int>(0, (sum, v) => sum + (const {'AnswerCorrect': 5}[v.ruleId] ?? 0));
                          final _stars = List.filled(_verdicts.length, '⭐').join();
                          return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text('$_stars  (${_verdicts.length}/1)', style: Theme.of(context).textTheme.headlineMedium),
                            Text('Score: $_points ⭐', style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: AppSpacing.sm),
                            Wrap(spacing: AppSpacing.sm, runSpacing: AppSpacing.sm, children: [
                          _verdicts.any((v) => v.ruleId == 'AnswerCorrect') ? const AppChip(label: 'Correct! +5 stars', tone: AppChipTone.success) : const AppChip(label: '✗', tone: AppChipTone.neutral),
                            ]),
                            const SizedBox(height: AppSpacing.sm),
                          ]);
                        }),
                        Text('Answer: ${(state.answer?.name ?? '—')}'),
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
                        TextButton(onPressed: () => context.read<PickWizardCubit>().back(), child: const Text('Back')),
                      const Spacer(),
                      PrimaryButton(
                        label: state.isLastStep ? 'Finish' : 'Next',
                        onPressed: state.canAdvance
                            ? () {
                                if (state.isLastStep) {
                                  context.read<PickWizardCubit>().finish();
                                } else {
                                  context.read<PickWizardCubit>().next();
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
