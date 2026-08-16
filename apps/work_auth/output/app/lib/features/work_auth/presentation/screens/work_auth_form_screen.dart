// [generated] generator=CrudFormGenerator template=crud_form_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_work_auth/core/components.dart';
import 'package:rasheed_replica_work_auth/core/theme.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/presentation/state/work_auth_list.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/work_auth.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/work_auth_status.dart';



class WorkAuthFormScreen extends StatelessWidget {
  const WorkAuthFormScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: Text(id == null ? 'New WorkAuth' : 'Edit WorkAuth')),
      body: BlocBuilder<WorkAuthListCubit, WorkAuthListState>(
        builder: (context, state) {
          final matches = state.workAuths.where((e) => e.id == id);
          final initial = id == null || matches.isEmpty ? null : matches.first;
          return _WorkAuthFormScreenBody(
            key: ValueKey(id ?? 'new'),
            initial: initial,
            id: id,
            onSubmit: (item) => id == null
                ? context.read<WorkAuthListCubit>().create(item)
                : context.read<WorkAuthListCubit>().update(item),
          );
        },
      ),
    );
  }
}

class _WorkAuthFormScreenBody extends StatefulWidget {
  const _WorkAuthFormScreenBody({super.key, required this.initial, required this.id, required this.onSubmit});
  final WorkAuth? initial;
  final String? id;
  final Future<void> Function(WorkAuth) onSubmit;

  @override
  State<_WorkAuthFormScreenBody> createState() => _WorkAuthFormScreenBodyState();
}

class _WorkAuthFormScreenBodyState extends State<_WorkAuthFormScreenBody> {
  final _name = TextEditingController();
  final _country = TextEditingController();
  final _jobTitle = TextEditingController();
  final _startDate = TextEditingController();
  final _durationDays = TextEditingController();
  WorkAuthStatus _status = WorkAuthStatus.values.first;
  final _nameFocus = FocusNode();



  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    _name.text = i?.name ?? '';
    _country.text = i?.country ?? '';
    _jobTitle.text = i?.jobTitle ?? '';
    _startDate.text = i?.startDate == null ? '' : i!.startDate.toIso8601String().split('T').first;
    _durationDays.text = i?.durationDays.toString() ?? '';
    if (i != null) _status = i.status;

  }

  @override
  void dispose() {
    _name.dispose();
    _country.dispose();
    _jobTitle.dispose();
    _startDate.dispose();
    _durationDays.dispose();
    _nameFocus.dispose();


    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: ListView(
        children: [
        TextField(controller: _name, focusNode: _nameFocus, onTap: () => _nameFocus.requestFocus(), decoration: const InputDecoration(labelText: 'Name')),
        TextField(controller: _country, decoration: const InputDecoration(labelText: 'Country')),
        TextField(controller: _jobTitle, decoration: const InputDecoration(labelText: 'Job Title')),
        TextField(controller: _startDate, readOnly: true, decoration: const InputDecoration(labelText: 'Start Date', hintText: 'YYYY-MM-DD'), onTap: () async {
          final picked = await showDatePicker(context: context, initialDate: DateTime.tryParse(_startDate.text) ?? DateTime.now(), firstDate: DateTime(1900), lastDate: DateTime(2100));
          if (picked != null) setState(() => _startDate.text = picked.toIso8601String().split('T').first);
        }),
        TextField(controller: _durationDays, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Duration Days')),
        Wrap(spacing: AppSpacing.sm, children: WorkAuthStatus.values.map((v) => ChoiceChip(label: Text(v.name), selected: _status == v, selectedColor: AppChip.colorForTone(context, AppChip.toneForStatus(v.name)).withValues(alpha: 0.2), onSelected: (_) => setState(() => _status = v))).toList()),
          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: widget.id == null ? 'Create' : 'Save',
            onPressed: () async {
              final item = WorkAuth(
        id: widget.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        name: _name.text,
        country: _country.text,
        jobTitle: _jobTitle.text,
        startDate: (DateTime.tryParse(_startDate.text) ?? DateTime.now()),
        durationDays: (int.tryParse(_durationDays.text) ?? 0),
        status: _status,
              );
              // Await the mutation before navigating — otherwise the detail/list screen we're
              // about to navigate to can render one frame ahead of the state update (race).
              await widget.onSubmit(item);
              if (context.mounted) context.go('/work-auth');
            },
          ),
        ],
      ),
    );
  }
}
