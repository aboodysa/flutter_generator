// [generated] generator=AppShellGenerator template=app_shell.v1 class=pattern ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) => navigationShell.goBranch(
          index,
          initialLocation: index == navigationShell.currentIndex,
        ),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.person), label: 'Users'), // feature: auth
          NavigationDestination(icon: Icon(Icons.receipt_long), label: 'Expense Claims'), // feature: expenses
          NavigationDestination(icon: Icon(Icons.approval), label: 'Approvals'), // feature: approvals
          NavigationDestination(icon: Icon(Icons.account_balance_wallet), label: 'Meal Budgets'), // feature: budgets
        ],
      ),
    );
  }
}
