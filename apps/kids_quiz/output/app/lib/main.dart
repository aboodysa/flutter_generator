// [generated] generator=ProjectGenerator template=main.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'core/app_strings.dart';
import 'core/theme.dart';
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
    return BlocProvider<QuestionListCubit>(
      create: (_) => sl<QuestionListCubit>()..load(),
      child: BlocProvider<AchievementListCubit>(
      create: (_) => sl<AchievementListCubit>()..load(),
      child: BlocProvider<QuizRunListCubit>(
      create: (_) => sl<QuizRunListCubit>()..load(),
      child: BlocProvider<QuizRunWizardCubit>(
      create: (_) => sl<QuizRunWizardCubit>()..load(),
      child: MaterialApp.router(
        onGenerateTitle: (context) => AppStrings.of(context).appTitle,
        supportedLocales: const [Locale('en'), Locale('ar'), Locale('fr')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        theme: buildTheme(),
        darkTheme: buildThemeDark(),
        themeMode: ThemeMode.light,
        routerConfig: appRouter,
      )))));
  }
}
