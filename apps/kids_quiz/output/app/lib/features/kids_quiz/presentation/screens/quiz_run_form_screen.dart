// [generated] generator=CrudFormGenerator template=crud_form_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_kids_quiz/core/components.dart';
import 'package:rasheed_replica_kids_quiz/core/theme.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/presentation/state/quiz_run_list.dart';
import 'package:rasheed_replica_kids_quiz/core/app_strings.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/correct_option.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_category.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/run_status.dart';
import 'package:rasheed_replica_kids_quiz/core/policy.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/policy/quiz_run_policy.dart';


class QuizRunFormScreen extends StatelessWidget {
  const QuizRunFormScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: Text(id == null ? 'New QuizRun' : 'Edit QuizRun')),
      body: BlocBuilder<QuizRunListCubit, QuizRunListState>(
        builder: (context, state) {
          final matches = state.quizRuns.where((e) => e.id == id);
          final initial = id == null || matches.isEmpty ? null : matches.first;
          return _QuizRunFormScreenBody(
            key: ValueKey(id ?? 'new'),
            initial: initial,
            id: id,
            onSubmit: (item) => id == null
                ? context.read<QuizRunListCubit>().create(item)
                : context.read<QuizRunListCubit>().update(item),
          );
        },
      ),
    );
  }
}

class _QuizRunFormScreenBody extends StatefulWidget {
  const _QuizRunFormScreenBody({super.key, required this.initial, required this.id, required this.onSubmit});
  final QuizRun? initial;
  final String? id;
  final Future<void> Function(QuizRun) onSubmit;

  @override
  State<_QuizRunFormScreenBody> createState() => _QuizRunFormScreenBodyState();
}

class _QuizRunFormScreenBodyState extends State<_QuizRunFormScreenBody> {
  final _playerName = TextEditingController();
  QuizCategory _category = QuizCategory.values.first;
  CorrectOption _q1Answer = CorrectOption.values.first;
  CorrectOption _q2Answer = CorrectOption.values.first;
  CorrectOption _q3Answer = CorrectOption.values.first;
  RunStatus _status = RunStatus.values.first;
  final _playerNameFocus = FocusNode();
  final Map<String, TextEditingController> _waiveReasonControllers = {};
  final Map<String, PolicyVerdict> _waivedVerdicts = {};
  final _policyJustification = TextEditingController();


  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    _playerName.text = i?.playerName ?? '';
    if (i != null) _category = i.category;
    if (i != null) _q1Answer = i.q1Answer;
    if (i != null) _q2Answer = i.q2Answer;
    if (i != null) _q3Answer = i.q3Answer;
    if (i != null) _status = i.status;

  }

  @override
  void dispose() {
    _playerName.dispose();
    _playerNameFocus.dispose();
    for (final c in _waiveReasonControllers.values) {
      c.dispose();
    }
    _policyJustification.dispose();

    super.dispose();
  }

  TextEditingController _waiveController(String ruleId) =>
      _waiveReasonControllers.putIfAbsent(ruleId, () => TextEditingController());

  QuizRun _draft() => QuizRun(
        id: widget.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        playerName: _playerName.text,
        category: _category,
        q1Answer: _q1Answer,
        q2Answer: _q2Answer,
        q3Answer: _q3Answer,
        status: _status,
      );

  List<PolicyVerdict> _verdicts() => evaluateQuizRunPolicy(_draft())
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
        TextField(controller: _playerName, focusNode: _playerNameFocus, onTap: () => _playerNameFocus.requestFocus(), decoration: const InputDecoration(labelText: 'Player Name')),
        DropdownButton<QuizCategory>(value: _category, items: QuizCategory.values.map((v) => DropdownMenuItem(value: v, child: Text(v.name))).toList(), onChanged: (v) => setState(() => _category = v ?? _category)),
        Wrap(spacing: AppSpacing.sm, children: CorrectOption.values.map((v) => ChoiceChip(label: Text(v.name), selected: _q1Answer == v, selectedColor: AppChip.colorForTone(context, AppChipTone.neutral).withValues(alpha: 0.2), onSelected: (_) => setState(() => _q1Answer = v))).toList()),
        Wrap(spacing: AppSpacing.sm, children: CorrectOption.values.map((v) => ChoiceChip(label: Text(v.name), selected: _q2Answer == v, selectedColor: AppChip.colorForTone(context, AppChipTone.neutral).withValues(alpha: 0.2), onSelected: (_) => setState(() => _q2Answer = v))).toList()),
        Wrap(spacing: AppSpacing.sm, children: CorrectOption.values.map((v) => ChoiceChip(label: Text(v.name), selected: _q3Answer == v, selectedColor: AppChip.colorForTone(context, AppChipTone.neutral).withValues(alpha: 0.2), onSelected: (_) => setState(() => _q3Answer = v))).toList()),
        Wrap(spacing: AppSpacing.sm, children: RunStatus.values.map((v) => ChoiceChip(label: Text(v.name), selected: _status == v, selectedColor: AppChip.colorForTone(context, AppChip.toneForStatus(v.name)).withValues(alpha: 0.2), onSelected: (_) => setState(() => _status = v))).toList()),
          _policyPanel(),
          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: widget.id == null ? AppStrings.of(context).create : AppStrings.of(context).save,
            onPressed: _verdicts().any((v) => v.blocksAdvance || (v.requiresJustification && _policyJustification.text.trim().isEmpty))
                ? null
                : () async {
              final item = _draft();
              // Await the mutation before navigating — otherwise the detail/list screen we're
              // about to navigate to can render one frame ahead of the state update (race).
              await widget.onSubmit(item);
              if (context.mounted) context.go('/quiz-run');
            },
          ),
        ],
      ),
    );
  }
}
