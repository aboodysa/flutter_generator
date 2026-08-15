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

  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    _title.text = i?.title ?? '';
    _description.text = i?.description ?? '';
    _dueDate.text = i?.dueDate?.toIso8601String() ?? '';
    if (i != null) _priority = i.priority;
    if (i != null) _status = i.status;
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _dueDate.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: ListView(
        children: [
        TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
        TextField(controller: _description, decoration: const InputDecoration(labelText: 'Description')),
        TextField(controller: _dueDate, decoration: const InputDecoration(labelText: 'Due Date', hintText: 'YYYY-MM-DD')),
        DropdownButton<Priority>(value: _priority, items: Priority.values.map((v) => DropdownMenuItem(value: v, child: Text(v.name))).toList(), onChanged: (v) => setState(() => _priority = v ?? _priority)),
        DropdownButton<TaskStatus>(value: _status, items: TaskStatus.values.map((v) => DropdownMenuItem(value: v, child: Text(v.name))).toList(), onChanged: (v) => setState(() => _status = v ?? _status)),
          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: widget.id == null ? 'Create' : 'Save',
            onPressed: () async {
              final item = Task(
        id: widget.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        title: _title.text,
        description: (_description.text.isEmpty ? null : _description.text),
        dueDate: (_dueDate.text.isEmpty ? null : DateTime.tryParse(_dueDate.text)),
        priority: _priority,
        status: _status,
              );
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
