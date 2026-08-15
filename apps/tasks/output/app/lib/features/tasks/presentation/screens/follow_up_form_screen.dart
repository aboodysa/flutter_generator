// [generated] generator=CrudFormGenerator template=crud_form_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_tasks/core/components.dart';
import 'package:rasheed_replica_tasks/core/theme.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/state/follow_up_list.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/follow_up.dart';

class FollowUpFormScreen extends StatelessWidget {
  const FollowUpFormScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: Text(id == null ? 'New FollowUp' : 'Edit FollowUp')),
      body: BlocBuilder<FollowUpListCubit, FollowUpListState>(
        builder: (context, state) {
          final matches = state.followUps.where((e) => e.id == id);
          final initial = id == null || matches.isEmpty ? null : matches.first;
          return _FollowUpFormScreenBody(
            key: ValueKey(id ?? 'new'),
            initial: initial,
            id: id,
            queryParams: GoRouterState.of(context).uri.queryParameters,
            onSubmit: (item) => id == null
                ? context.read<FollowUpListCubit>().create(item)
                : context.read<FollowUpListCubit>().update(item),
          );
        },
      ),
    );
  }
}

class _FollowUpFormScreenBody extends StatefulWidget {
  const _FollowUpFormScreenBody({super.key, required this.initial, required this.id, required this.queryParams, required this.onSubmit});
  final FollowUp? initial;
  final String? id;
  final Map<String, String> queryParams;
  final Future<void> Function(FollowUp) onSubmit;

  @override
  State<_FollowUpFormScreenBody> createState() => _FollowUpFormScreenBodyState();
}

class _FollowUpFormScreenBodyState extends State<_FollowUpFormScreenBody> {
  final _taskId = TextEditingController();
  final _note = TextEditingController();
  final _createdAt = TextEditingController();


  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    _taskId.text = i?.taskId ?? widget.queryParams['taskId'] ?? '';
    _note.text = i?.note ?? '';
    _createdAt.text = i?.createdAt == null ? '' : i!.createdAt!.toIso8601String().split('T').first;
  }

  @override
  void dispose() {
    _taskId.dispose();
    _note.dispose();
    _createdAt.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: ListView(
        children: [
        TextField(autofocus: widget.id == null, controller: _taskId, decoration: const InputDecoration(labelText: 'Task Id')),
        TextField(controller: _note, decoration: const InputDecoration(labelText: 'Note')),
        TextField(controller: _createdAt, readOnly: true, decoration: const InputDecoration(labelText: 'Created At', hintText: 'YYYY-MM-DD'), onTap: () async {
          final picked = await showDatePicker(context: context, initialDate: DateTime.tryParse(_createdAt.text) ?? DateTime.now(), firstDate: DateTime(1900), lastDate: DateTime(2100));
          if (picked != null) setState(() => _createdAt.text = picked.toIso8601String().split('T').first);
        }),
          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: widget.id == null ? 'Create' : 'Save',
            onPressed: () async {
              final item = FollowUp(
        id: widget.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        taskId: _taskId.text,
        note: _note.text,
        createdAt: (_createdAt.text.isEmpty ? null : DateTime.tryParse(_createdAt.text)),
              );
              // Await the mutation before navigating — otherwise the detail/list screen we're
              // about to navigate to can render one frame ahead of the state update (race).
              await widget.onSubmit(item);
              if (context.mounted) context.go('/follow-up/${item.id}');
            },
          ),
        ],
      ),
    );
  }
}
