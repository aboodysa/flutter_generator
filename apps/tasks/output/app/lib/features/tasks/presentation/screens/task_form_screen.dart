// [generated] generator=CrudFormGenerator template=crud_form_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_tasks/core/components.dart';
import 'package:rasheed_replica_tasks/core/theme.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/state/task_list.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/priority.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/task.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/task_status.dart';
import 'package:rasheed_replica_tasks/core/policy.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/policy/task_policy.dart';


class TaskFormScreen extends StatelessWidget {
  const TaskFormScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: Text(id == null ? 'New Task' : 'Edit Task')),
      body: BlocBuilder<TaskListCubit, TaskListState>(
        builder: (context, state) {
          final matches = state.tasks.where((e) => e.id == id);
          final initial = id == null || matches.isEmpty ? null : matches.first;
          return _TaskFormScreenBody(
            key: ValueKey(id ?? 'new'),
            initial: initial,
            id: id,
            onSubmit: (item) => id == null
                ? context.read<TaskListCubit>().create(item)
                : context.read<TaskListCubit>().update(item),
          );
        },
      ),
    );
  }
}

class _TaskFormScreenBody extends StatefulWidget {
  const _TaskFormScreenBody({super.key, required this.initial, required this.id, required this.onSubmit});
  final Task? initial;
  final String? id;
  final Future<void> Function(Task) onSubmit;

  @override
  State<_TaskFormScreenBody> createState() => _TaskFormScreenBodyState();
}

class _TaskFormScreenBodyState extends State<_TaskFormScreenBody> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _dueDate = TextEditingController();
  Priority _priority = Priority.values.first;
  TaskStatus _status = TaskStatus.values.first;
  final _titleFocus = FocusNode();
  final Map<String, TextEditingController> _waiveReasonControllers = {};
  final Map<String, PolicyVerdict> _waivedVerdicts = {};
  final _policyJustification = TextEditingController();


  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    _title.text = i?.title ?? '';
    _description.text = i?.description ?? '';
    _dueDate.text = i?.dueDate == null ? '' : i!.dueDate!.toIso8601String().split('T').first;
    if (i != null) _priority = i.priority;
    if (i != null) _status = i.status;

  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _dueDate.dispose();
    _titleFocus.dispose();
    for (final c in _waiveReasonControllers.values) {
      c.dispose();
    }
    _policyJustification.dispose();

    super.dispose();
  }

  TextEditingController _waiveController(String ruleId) =>
      _waiveReasonControllers.putIfAbsent(ruleId, () => TextEditingController());

  Task _draft() => Task(
        id: widget.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        title: _title.text,
        description: (_description.text.isEmpty ? null : _description.text),
        dueDate: (_dueDate.text.isEmpty ? null : DateTime.tryParse(_dueDate.text)),
        priority: _priority,
        status: _status,
      );

  List<PolicyVerdict> _verdicts() => evaluateTaskPolicy(_draft())
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
        TextField(controller: _title, focusNode: _titleFocus, onTap: () => _titleFocus.requestFocus(), decoration: const InputDecoration(labelText: 'Title')),
        TextField(controller: _description, decoration: const InputDecoration(labelText: 'Description')),
        TextField(controller: _dueDate, readOnly: true, decoration: const InputDecoration(labelText: 'Due Date', hintText: 'YYYY-MM-DD'), onTap: () async {
          final picked = await showDatePicker(context: context, initialDate: DateTime.tryParse(_dueDate.text) ?? DateTime.now(), firstDate: DateTime(1900), lastDate: DateTime(2100));
          if (picked != null) setState(() => _dueDate.text = picked.toIso8601String().split('T').first);
        }),
        Wrap(spacing: AppSpacing.sm, children: Priority.values.map((v) => ChoiceChip(label: Text(v.name), selected: _priority == v, selectedColor: AppChip.colorForTone(context, AppChip.toneForPriority(v.name)).withValues(alpha: 0.2), onSelected: (_) => setState(() => _priority = v))).toList()),
        Wrap(spacing: AppSpacing.sm, children: TaskStatus.values.map((v) => ChoiceChip(label: Text(v.name), selected: _status == v, selectedColor: AppChip.colorForTone(context, AppChip.toneForStatus(v.name)).withValues(alpha: 0.2), onSelected: (_) => setState(() => _status = v))).toList()),
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
              if (context.mounted) context.go('/task/${item.id}');
            },
          ),
        ],
      ),
    );
  }
}
