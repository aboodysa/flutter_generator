// [generated] generator=ProjectGenerator template=main_multi.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'core/app_strings.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'generated.dart';import 'core/router.dart';
import 'core/di.dart';
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // A11y (§14.4): expose the semantics tree (aria/text) to the DOM on web so the app
  // is screen-reader readable AND browser-testable (CFT/puppeteer) out of the box.
  SemanticsBinding.instance.ensureSemantics();
  setupDependencies();
  runApp(const ReplicaApp());
}

class ReplicaApp extends StatelessWidget {
  const ReplicaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<UserListCubit>(create: (_) => sl<UserListCubit>()..load()),
        BlocProvider<ExpenseClaimListCubit>(create: (_) => sl<ExpenseClaimListCubit>()..load()),
        BlocProvider<ExpenseClaimSplitListCubit>(create: (_) => sl<ExpenseClaimSplitListCubit>()..load()),
        BlocProvider<ApprovalListCubit>(create: (_) => sl<ApprovalListCubit>()..load()),
        BlocProvider<MealBudgetListCubit>(create: (_) => sl<MealBudgetListCubit>()..load()),
      ],
      child: MaterialApp.router(
        onGenerateTitle: (context) => AppStrings.of(context).appTitle,
        supportedLocales: const [Locale('en'), Locale('ar')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        theme: ThemeData(colorSchemeSeed: Colors.teal),
        routerConfig: appRouter,
      ),
    );
  }
}
