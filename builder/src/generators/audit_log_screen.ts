import { FeatureModel } from "../types";
import { GenContext } from "../dart";

/**
 * AuditLogScreenGenerator — structural, deterministic, 0% LLM (L3).
 * Emits `core/audit_log_screen.dart` once per app with >=1 audited entity (operations.ts's
 * hasAudit) — an app-level screen (mirrors auth_login_screen.dart's placement: not tied to any
 * one feature, since AuditLog aggregates events across every audited entity regardless of which
 * feature declared it). Reachable via the app's own routing — route.ts registers `/audit-log`
 * whenever this file is emitted, and the sample IRs opt finance/hr_admin-style roles into it via
 * the existing MF2 `auth.allow` mechanism (no new routing concept, just another allowed prefix).
 *
 * Filterable by entity/actor (simple dropdowns over the distinct values actually present — no
 * hardcoded vocabulary, so it works unchanged whether one or many entities are audited); shows
 * before→after as the entities' own `${Entity}Model.toJson()` snapshots (already captured at
 * write time in repository_impl.ts), rendered as their Dart Map.toString() — a plain, honest
 * dump rather than a bespoke diff UI, matching this generator's "minimal but real" bar elsewhere.
 */
export function generateAuditLogScreen(_ir: FeatureModel, ctx?: GenContext): string {
  const componentsImport = ctx ? `import 'package:${ctx.pkg}/core/components.dart';` : "import '../core/components.dart';";
  const themeImport = ctx ? `import 'package:${ctx.pkg}/core/theme.dart';` : "import '../core/theme.dart';";
  const auditImport = ctx ? `import 'package:${ctx.pkg}/core/audit.dart';` : "import 'audit.dart';";

  return `// [generated] generator=AuditLogScreenGenerator template=audit_log_screen.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
${componentsImport}
${themeImport}
${auditImport}

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
                          title: Text('\${event.entity} #\${event.entityId} · \${event.action}'),
                          subtitle: Text(
                            '\${event.actor} · \${event.timestamp.toIso8601String()}\\n'
                            'before: \${event.before ?? '—'}\\n'
                            'after: \${event.after ?? '—'}',
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
`;
}
