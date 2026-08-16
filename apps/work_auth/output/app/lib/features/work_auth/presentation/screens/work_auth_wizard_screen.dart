// [generated] generator=ScreenGenerator template=screen_wizard_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_work_auth/core/components.dart';
import 'package:rasheed_replica_work_auth/core/theme.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/presentation/state/work_auth_wizard.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/work_auth_status.dart';



class WorkAuthWizardScreen extends StatelessWidget {
  const WorkAuthWizardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Work Auths')),
      body: BlocBuilder<WorkAuthWizardCubit, WorkAuthWizardState>(
        builder: (context, state) {
        if (state.status == WorkAuthWizardStatus.loading) return const LoadingState();
        if (state.status == WorkAuthWizardStatus.failure) return ErrorState(message: state.errorMessage);
            if (state.wizardStatus == WorkAuthWizardStatus.success) return const Center(child: Text('All done!'));
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                LinearProgressIndicator(value: (state.currentStep + 1) / 4),
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.lg, AppSpacing.md, 16.0),
                  child: Text(
                    switch (state.currentStep) {
                      0 => 'Submit Work Authorization',
                      1 => 'Manager Review Required',
                      2 => 'Review',
                      3 => 'Result',
                      _ => '',
                    },
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                    child: switch (state.currentStep) {
                      0 => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                        TextFormField(key: const ValueKey('field-name'), initialValue: state.name ?? '', decoration: const InputDecoration(labelText: 'Name'), onChanged: (v) => context.read<WorkAuthWizardCubit>().setName(v)),
                        TextFormField(key: const ValueKey('field-country'), initialValue: state.country ?? '', decoration: const InputDecoration(labelText: 'Country'), onChanged: (v) => context.read<WorkAuthWizardCubit>().setCountry(v)),
                        TextFormField(key: const ValueKey('field-jobTitle'), initialValue: state.jobTitle ?? '', decoration: const InputDecoration(labelText: 'Job Title'), onChanged: (v) => context.read<WorkAuthWizardCubit>().setJobTitle(v)),
                        TextFormField(key: const ValueKey('field-durationDays'), initialValue: state.durationDays?.toString() ?? '', keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Duration Days'), onChanged: (v) => context.read<WorkAuthWizardCubit>().setDurationDays(int.tryParse(v))),
                      ]),
                      1 => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Name: ${(state.name?.toString() ?? '—')}'),
                        Text('Country: ${(state.country?.toString() ?? '—')}'),
                        Text('Job Title: ${(state.jobTitle?.toString() ?? '—')}'),
                        Text('Duration Days: ${(state.durationDays?.toString() ?? '—')}'),
                      ]),
                      2 => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Name: ${(state.name?.toString() ?? '—')}'),
                        Text('Country: ${(state.country?.toString() ?? '—')}'),
                        Text('Job Title: ${(state.jobTitle?.toString() ?? '—')}'),
                        Text('Duration Days: ${(state.durationDays?.toString() ?? '—')}'),
                        Wrap(key: const ValueKey('field-status'), spacing: AppSpacing.sm, children: WorkAuthStatus.values.map((v) => ChoiceChip(label: Text(v.name), selected: state.status == v, selectedColor: AppChip.colorForTone(context, AppChip.toneForStatus(v.name)).withValues(alpha: 0.2), onSelected: (_) => context.read<WorkAuthWizardCubit>().setStatus(v))).toList()),
                      ]),
                      3 => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Name: ${(state.name?.toString() ?? '—')}'),
                        Text('Country: ${(state.country?.toString() ?? '—')}'),
                        Text('Job Title: ${(state.jobTitle?.toString() ?? '—')}'),
                        Text('Duration Days: ${(state.durationDays?.toString() ?? '—')}'),
                        Text('Status: ${(state.status?.name ?? '—')}'),
                      ]),
                      _ => const SizedBox(),
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      if (state.currentStep > 0)
                        TextButton(onPressed: () => context.read<WorkAuthWizardCubit>().back(), child: const Text('Back')),
                      const Spacer(),
                      PrimaryButton(
                        label: state.isLastStep ? 'Finish' : 'Next',
                        onPressed: state.canAdvance
                            ? () {
                                if (state.isLastStep) {
                                  context.read<WorkAuthWizardCubit>().finish();
                                } else {
                                  context.read<WorkAuthWizardCubit>().next();
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
