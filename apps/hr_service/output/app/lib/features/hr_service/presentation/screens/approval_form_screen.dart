// [generated] generator=CrudFormGenerator template=crud_form_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_hr_service/core/components.dart';
import 'package:rasheed_replica_hr_service/core/theme.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/state/approval_list.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/approval.dart';



class ApprovalFormScreen extends StatelessWidget {
  const ApprovalFormScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: Text(id == null ? 'New Approval' : 'Edit Approval')),
      body: BlocBuilder<ApprovalListCubit, ApprovalListState>(
        builder: (context, state) {
          final matches = state.approvals.where((e) => e.id == id);
          final initial = id == null || matches.isEmpty ? null : matches.first;
          return _ApprovalFormScreenBody(
            key: ValueKey(id ?? 'new'),
            initial: initial,
            id: id,
            queryParams: GoRouterState.of(context).uri.queryParameters,
            onSubmit: (item) => id == null
                ? context.read<ApprovalListCubit>().create(item)
                : context.read<ApprovalListCubit>().update(item),
          );
        },
      ),
    );
  }
}

class _ApprovalFormScreenBody extends StatefulWidget {
  const _ApprovalFormScreenBody({super.key, required this.initial, required this.id, required this.queryParams, required this.onSubmit});
  final Approval? initial;
  final String? id;
  final Map<String, String> queryParams;
  final Future<void> Function(Approval) onSubmit;

  @override
  State<_ApprovalFormScreenBody> createState() => _ApprovalFormScreenBodyState();
}

class _ApprovalFormScreenBodyState extends State<_ApprovalFormScreenBody> {
  final _leaveRequestId = TextEditingController();
  final _approver = TextEditingController();
  final _note = TextEditingController();
  final _decidedAt = TextEditingController();

  final _leaveRequestIdFocus = FocusNode();



  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    _leaveRequestId.text = i?.leaveRequestId ?? widget.queryParams['leaveRequestId'] ?? '';
    _approver.text = i?.approver ?? '';
    _note.text = i?.note ?? '';
    _decidedAt.text = i?.decidedAt == null ? '' : i!.decidedAt!.toIso8601String().split('T').first;

  }

  @override
  void dispose() {
    _leaveRequestId.dispose();
    _approver.dispose();
    _note.dispose();
    _decidedAt.dispose();
    _leaveRequestIdFocus.dispose();


    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: ListView(
        children: [
        TextField(controller: _leaveRequestId, focusNode: _leaveRequestIdFocus, onTap: () => _leaveRequestIdFocus.requestFocus(), decoration: const InputDecoration(labelText: 'Leave Request Id')),
        TextField(controller: _approver, decoration: const InputDecoration(labelText: 'Approver')),
        TextField(controller: _note, decoration: const InputDecoration(labelText: 'Note')),
        TextField(controller: _decidedAt, readOnly: true, decoration: const InputDecoration(labelText: 'Decided At', hintText: 'YYYY-MM-DD'), onTap: () async {
          final picked = await showDatePicker(context: context, initialDate: DateTime.tryParse(_decidedAt.text) ?? DateTime.now(), firstDate: DateTime(1900), lastDate: DateTime(2100));
          if (picked != null) setState(() => _decidedAt.text = picked.toIso8601String().split('T').first);
        }),
          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: widget.id == null ? 'Create' : 'Save',
            onPressed: () async {
              final item = Approval(
        id: widget.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        leaveRequestId: _leaveRequestId.text,
        approver: _approver.text,
        note: (_note.text.isEmpty ? null : _note.text),
        decidedAt: (_decidedAt.text.isEmpty ? null : DateTime.tryParse(_decidedAt.text)),
              );
              // Await the mutation before navigating — otherwise the detail/list screen we're
              // about to navigate to can render one frame ahead of the state update (race).
              await widget.onSubmit(item);
              if (context.mounted) context.go('/approval');
            },
          ),
        ],
      ),
    );
  }
}
