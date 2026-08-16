// [generated] generator=AuthLoginGenerator template=auth_login.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:rasheed_replica_ledgerly/core/components.dart';
import 'package:rasheed_replica_ledgerly/core/theme.dart';
import 'package:rasheed_replica_ledgerly/core/session.dart';
import 'package:rasheed_replica_ledgerly/core/router.dart';
import 'package:rasheed_replica_ledgerly/core/app_strings.dart';

/// Demo login — one tappable AppListCard per persona (kPersonas from session.dart). Tapping
/// signs the session in and navigates to that role's home route (kHomeRoutes from router.dart).
class AuthLoginScreen extends StatelessWidget {
  const AuthLoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(AppStrings.of(context).signIn)),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          Text(AppStrings.of(context).chooseDemoAccount, style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: AppSpacing.sm),
          for (final p in kPersonas)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: AppListCard(
                card: true,
                leading: AppAvatar(label: p.name),
                title: Text(p.name),
                subtitle: Text('${p.role} · ${p.tenantId}'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Session.instance.signIn(role: p.role, actorId: p.actorId, tenantId: p.tenantId, displayName: p.name);
                  context.go(kHomeRoutes[p.role] ?? '/');
                },
              ),
            ),
        ],
      ),
    );
  }
}
