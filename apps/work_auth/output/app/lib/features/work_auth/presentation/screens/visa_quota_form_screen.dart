// [generated] generator=CrudFormGenerator template=crud_form_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_work_auth/core/components.dart';
import 'package:rasheed_replica_work_auth/core/theme.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/presentation/state/visa_quota_list.dart';
import 'package:rasheed_replica_work_auth/core/money.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/visa_quota.dart';



class VisaQuotaFormScreen extends StatelessWidget {
  const VisaQuotaFormScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: Text(id == null ? 'New VisaQuota' : 'Edit VisaQuota')),
      body: BlocBuilder<VisaQuotaListCubit, VisaQuotaListState>(
        builder: (context, state) {
          final matches = state.visaQuotas.where((e) => e.id == id);
          final initial = id == null || matches.isEmpty ? null : matches.first;
          return _VisaQuotaFormScreenBody(
            key: ValueKey(id ?? 'new'),
            initial: initial,
            id: id,
            onSubmit: (item) => id == null
                ? context.read<VisaQuotaListCubit>().create(item)
                : context.read<VisaQuotaListCubit>().update(item),
          );
        },
      ),
    );
  }
}

class _VisaQuotaFormScreenBody extends StatefulWidget {
  const _VisaQuotaFormScreenBody({super.key, required this.initial, required this.id, required this.onSubmit});
  final VisaQuota? initial;
  final String? id;
  final Future<void> Function(VisaQuota) onSubmit;

  @override
  State<_VisaQuotaFormScreenBody> createState() => _VisaQuotaFormScreenBodyState();
}

class _VisaQuotaFormScreenBodyState extends State<_VisaQuotaFormScreenBody> {
  final _name = TextEditingController();
  final _limit = TextEditingController();
  final _committed = TextEditingController();
  final _actual = TextEditingController();

  final _nameFocus = FocusNode();



  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    _name.text = i?.name ?? '';
    _limit.text = i?.limit == null ? '' : (i!.limit.minorUnits / 100).toStringAsFixed(2);
    _committed.text = i?.committed == null ? '' : (i!.committed.minorUnits / 100).toStringAsFixed(2);
    _actual.text = i?.actual == null ? '' : (i!.actual.minorUnits / 100).toStringAsFixed(2);

  }

  @override
  void dispose() {
    _name.dispose();
    _limit.dispose();
    _committed.dispose();
    _actual.dispose();
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
        TextField(controller: _limit, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Limit', suffixText: 'VSA')),
        TextField(controller: _committed, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Committed', suffixText: 'VSA')),
        TextField(controller: _actual, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Actual', suffixText: 'VSA')),
          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: widget.id == null ? 'Create' : 'Save',
            onPressed: () async {
              final item = VisaQuota(
        id: widget.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        name: _name.text,
        limit: Money(minorUnits: ((double.tryParse(_limit.text) ?? 0.0) * 100).round(), currency: 'VSA'),
        committed: Money(minorUnits: ((double.tryParse(_committed.text) ?? 0.0) * 100).round(), currency: 'VSA'),
        actual: Money(minorUnits: ((double.tryParse(_actual.text) ?? 0.0) * 100).round(), currency: 'VSA'),
              );
              // Await the mutation before navigating — otherwise the detail/list screen we're
              // about to navigate to can render one frame ahead of the state update (race).
              await widget.onSubmit(item);
              if (context.mounted) context.pushReplacement('/visa-quota/${item.id}');
            },
          ),
        ],
      ),
    );
  }
}
