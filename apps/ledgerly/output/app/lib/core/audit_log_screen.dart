// [generated] generator=AuditLogScreenGenerator template=audit_log_screen.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:rasheed_replica_ledgerly/core/components.dart';
import 'package:rasheed_replica_ledgerly/core/theme.dart';
import 'package:rasheed_replica_ledgerly/core/audit.dart';

/// L3: who did what to which record, before/after, filterable by entity/actor.
class AuditLogScreen extends StatefulWidget {
  const AuditLogScreen({super.key});

  @override
  State<AuditLogScreen> createState() => _AuditLogScreenState();
}

class _AuditLogScreenState extends State<AuditLogScreen> {
  String? _entityFilter;
  String? _actorFilter;

  @override
  Widget build(BuildContext context) {
    final events = AuditLog.instance.events;
    final entities = events.map((e) => e.entity).toSet().toList()..sort();
    final actors = events.map((e) => e.actor).toSet().toList()..sort();
    final filtered = events
        .where((e) => (_entityFilter == null || e.entity == _entityFilter) && (_actorFilter == null || e.actor == _actorFilter))
        .toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Audit log')),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                Expanded(
                  child: DropdownButton<String?>(
                    value: _entityFilter,
                    isExpanded: true,
                    hint: const Text('All entities'),
                    items: [
                      const DropdownMenuItem<String?>(value: null, child: Text('All entities')),
                      for (final e in entities) DropdownMenuItem<String?>(value: e, child: Text(e)),
                    ],
                    onChanged: (v) => setState(() => _entityFilter = v),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: DropdownButton<String?>(
                    value: _actorFilter,
                    isExpanded: true,
                    hint: const Text('All actors'),
                    items: [
                      const DropdownMenuItem<String?>(value: null, child: Text('All actors')),
                      for (final a in actors) DropdownMenuItem<String?>(value: a, child: Text(a)),
                    ],
                    onChanged: (v) => setState(() => _actorFilter = v),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: filtered.isEmpty
                ? const Center(child: Text('No audit events yet'))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                    itemCount: filtered.length,
                    itemBuilder: (_, i) {
                      final event = filtered[i];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                        child: AppListCard(
                          card: true,
                          title: Text('${event.entity} #${event.entityId} · ${event.action}'),
                          subtitle: Text(
                            '${event.actor} · ${event.timestamp.toIso8601String()}\n'
                            'before: ${event.before ?? '—'}\n'
                            'after: ${event.after ?? '—'}',
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
