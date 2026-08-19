// [generated] generator=CrudFormGenerator template=crud_form_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_choice_demo/core/components.dart';
import 'package:rasheed_replica_choice_demo/core/theme.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/presentation/state/pick_list.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/answer_option.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/mood_option.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/pick.dart';
import 'package:rasheed_replica_choice_demo/core/policy.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/policy/pick_policy.dart';


class PickFormScreen extends StatelessWidget {
  const PickFormScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: Text(id == null ? 'New Pick' : 'Edit Pick')),
      body: BlocBuilder<PickListCubit, PickListState>(
        builder: (context, state) {
          final matches = state.picks.where((e) => e.id == id);
          final initial = id == null || matches.isEmpty ? null : matches.first;
          return _PickFormScreenBody(
            key: ValueKey(id ?? 'new'),
            initial: initial,
            id: id,
            onSubmit: (item) => id == null
                ? context.read<PickListCubit>().create(item)
                : context.read<PickListCubit>().update(item),
          );
        },
      ),
    );
  }
}

class _PickFormScreenBody extends StatefulWidget {
  const _PickFormScreenBody({super.key, required this.initial, required this.id, required this.onSubmit});
  final Pick? initial;
  final String? id;
  final Future<void> Function(Pick) onSubmit;

  @override
  State<_PickFormScreenBody> createState() => _PickFormScreenBodyState();
}

class _PickFormScreenBodyState extends State<_PickFormScreenBody> {
  final _label = TextEditingController();
  AnswerOption _answer = AnswerOption.values.first;
  MoodOption _mood = MoodOption.values.first;
  final _labelFocus = FocusNode();
  final Map<String, TextEditingController> _waiveReasonControllers = {};
  final Map<String, PolicyVerdict> _waivedVerdicts = {};
  final _policyJustification = TextEditingController();


  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    _label.text = i?.label ?? '';
    if (i != null) _answer = i.answer;
    if (i != null) _mood = i.mood;

  }

  @override
  void dispose() {
    _label.dispose();
    _labelFocus.dispose();
    for (final c in _waiveReasonControllers.values) {
      c.dispose();
    }
    _policyJustification.dispose();

    super.dispose();
  }

  TextEditingController _waiveController(String ruleId) =>
      _waiveReasonControllers.putIfAbsent(ruleId, () => TextEditingController());

  Pick _draft() => Pick(
        id: widget.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        label: _label.text,
        answer: _answer,
        mood: _mood,
      );

  List<PolicyVerdict> _verdicts() => evaluatePickPolicy(_draft())
      .map((v) => _waivedVerdicts[v.ruleId] ?? v)
      .toList();

  Widget _policyPanel() {
    final visible = _verdicts().where((v) => v.severity != PolicySeverity.autoApprove).toList();
    if (visible.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final v in visible)
          Card(
            // M2/component-registry (§8): tone comes from the same AppChip.colorForTone mapping
            // ChoiceChip's selectedColor already uses below — no raw material-Colors literal.
            color: v.isWaived
                ? AppChip.colorForTone(context, AppChipTone.neutral).withValues(alpha: 0.12)
                : v.severity == PolicySeverity.block
                    ? AppChip.colorForTone(context, AppChipTone.danger).withValues(alpha: 0.08)
                    : v.severity == PolicySeverity.warn
                        ? AppChip.colorForTone(context, AppChipTone.warning).withValues(alpha: 0.08)
                        : AppChip.colorForTone(context, AppChipTone.info).withValues(alpha: 0.08),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.sm),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(v.isWaived ? '${v.message} (waived)' : v.message),
                  if (v.requiresJustification) ...[
                    const SizedBox(height: AppSpacing.xs),
                    TextField(
                      controller: _policyJustification,
                      decoration: const InputDecoration(labelText: 'Justification'),
                      onChanged: (_) => setState(() {}),
                    ),
                  ],
                  if (!v.isWaived) ...[
                    const SizedBox(height: AppSpacing.xs),
                    TextField(
                      controller: _waiveController(v.ruleId),
                      decoration: const InputDecoration(labelText: 'Waive reason'),
                      onChanged: (_) => setState(() {}),
                    ),
                    TextButton(
                      onPressed: _waiveController(v.ruleId).text.trim().isEmpty
                          ? null
                          : () => setState(() {
                                _waivedVerdicts[v.ruleId] = v.waive(
                                  waivedBy: 'current_user',
                                  waivedReason: _waiveController(v.ruleId).text,
                                );
                              }),
                      child: const Text('Waive'),
                    ),
                  ],
                ],
              ),
            ),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: ListView(
        children: [
        TextField(controller: _label, focusNode: _labelFocus, onTap: () => _labelFocus.requestFocus(), decoration: const InputDecoration(labelText: 'Label')),
        Wrap(spacing: AppSpacing.sm, children: AnswerOption.values.map((v) => ChoiceChip(label: Text(v.name), selected: _answer == v, selectedColor: AppChip.colorForTone(context, AppChipTone.neutral).withValues(alpha: 0.2), onSelected: (_) => setState(() => _answer = v))).toList()),
        DropdownButton<MoodOption>(value: _mood, items: MoodOption.values.map((v) => DropdownMenuItem(value: v, child: Text(v.name))).toList(), onChanged: (v) => setState(() => _mood = v ?? _mood)),
          _policyPanel(),
          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: widget.id == null ? 'Create' : 'Save',
            onPressed: _verdicts().any((v) => v.blocksAdvance || (v.requiresJustification && _policyJustification.text.trim().isEmpty))
                ? null
                : () async {
              final item = _draft();
              // Await the mutation before navigating — otherwise the detail/list screen we're
              // about to navigate to can render one frame ahead of the state update (race).
              await widget.onSubmit(item);
              if (context.mounted) context.go('/pick');
            },
          ),
        ],
      ),
    );
  }
}
