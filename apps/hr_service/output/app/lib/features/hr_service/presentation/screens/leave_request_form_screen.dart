// [generated] generator=CrudFormGenerator template=crud_form_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_hr_service/core/components.dart';
import 'package:rasheed_replica_hr_service/core/theme.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/state/leave_request_list.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_request.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_status.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_type.dart';



class LeaveRequestFormScreen extends StatelessWidget {
  const LeaveRequestFormScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: Text(id == null ? 'New LeaveRequest' : 'Edit LeaveRequest')),
      body: BlocBuilder<LeaveRequestListCubit, LeaveRequestListState>(
        builder: (context, state) {
          final matches = state.leaveRequests.where((e) => e.id == id);
          final initial = id == null || matches.isEmpty ? null : matches.first;
          return _LeaveRequestFormScreenBody(
            key: ValueKey(id ?? 'new'),
            initial: initial,
            id: id,
            onSubmit: (item) => id == null
                ? context.read<LeaveRequestListCubit>().create(item)
                : context.read<LeaveRequestListCubit>().update(item),
          );
        },
      ),
    );
  }
}

class _LeaveRequestFormScreenBody extends StatefulWidget {
  const _LeaveRequestFormScreenBody({super.key, required this.initial, required this.id, required this.onSubmit});
  final LeaveRequest? initial;
  final String? id;
  final Future<void> Function(LeaveRequest) onSubmit;

  @override
  State<_LeaveRequestFormScreenBody> createState() => _LeaveRequestFormScreenBodyState();
}

class _LeaveRequestFormScreenBodyState extends State<_LeaveRequestFormScreenBody> {
  final _name = TextEditingController();
  final _startDate = TextEditingController();
  final _endDate = TextEditingController();
  final _days = TextEditingController();
  final _reason = TextEditingController();
  LeaveType _leaveType = LeaveType.values.first;
  LeaveStatus _status = LeaveStatus.values.first;
  final _nameFocus = FocusNode();



  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    _name.text = i?.name ?? '';
    if (i != null) _leaveType = i.leaveType;
    _startDate.text = i?.startDate == null ? '' : i!.startDate.toIso8601String().split('T').first;
    _endDate.text = i?.endDate == null ? '' : i!.endDate.toIso8601String().split('T').first;
    _days.text = i?.days.toString() ?? '';
    if (i != null) _status = i.status;
    _reason.text = i?.reason ?? '';

  }

  @override
  void dispose() {
    _name.dispose();
    _startDate.dispose();
    _endDate.dispose();
    _days.dispose();
    _reason.dispose();
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
        DropdownButton<LeaveType>(value: _leaveType, items: LeaveType.values.map((v) => DropdownMenuItem(value: v, child: Text(v.name))).toList(), onChanged: (v) => setState(() => _leaveType = v ?? _leaveType)),
        TextField(controller: _startDate, readOnly: true, decoration: const InputDecoration(labelText: 'Start Date', hintText: 'YYYY-MM-DD'), onTap: () async {
          final picked = await showDatePicker(context: context, initialDate: DateTime.tryParse(_startDate.text) ?? DateTime.now(), firstDate: DateTime(1900), lastDate: DateTime(2100));
          if (picked != null) setState(() => _startDate.text = picked.toIso8601String().split('T').first);
        }),
        TextField(controller: _endDate, readOnly: true, decoration: const InputDecoration(labelText: 'End Date', hintText: 'YYYY-MM-DD'), onTap: () async {
          final picked = await showDatePicker(context: context, initialDate: DateTime.tryParse(_endDate.text) ?? DateTime.now(), firstDate: DateTime(1900), lastDate: DateTime(2100));
          if (picked != null) setState(() => _endDate.text = picked.toIso8601String().split('T').first);
        }),
        TextField(controller: _days, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Days')),
        Wrap(spacing: AppSpacing.sm, children: LeaveStatus.values.map((v) => ChoiceChip(label: Text(v.name), selected: _status == v, selectedColor: AppChip.colorForTone(context, AppChip.toneForStatus(v.name)).withValues(alpha: 0.2), onSelected: (_) => setState(() => _status = v))).toList()),
        TextField(controller: _reason, decoration: const InputDecoration(labelText: 'Reason')),
          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: widget.id == null ? 'Create' : 'Save',
            onPressed: () async {
              final item = LeaveRequest(
        id: widget.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        name: _name.text,
        leaveType: _leaveType,
        startDate: (DateTime.tryParse(_startDate.text) ?? DateTime.now()),
        endDate: (DateTime.tryParse(_endDate.text) ?? DateTime.now()),
        days: (int.tryParse(_days.text) ?? 0),
        status: _status,
        reason: (_reason.text.isEmpty ? null : _reason.text),
              );
              // Await the mutation before navigating — otherwise the detail/list screen we're
              // about to navigate to can render one frame ahead of the state update (race).
              await widget.onSubmit(item);
              if (context.mounted) context.go('/leave-request/${item.id}');
            },
          ),
        ],
      ),
    );
  }
}
