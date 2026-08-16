// [generated] generator=ProjectGenerator template=main.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
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
    return BlocProvider<WorkAuthListCubit>(
      create: (_) => sl<WorkAuthListCubit>()..load(),
      child: BlocProvider<WorkAuthWizardCubit>(
      create: (_) => sl<WorkAuthWizardCubit>()..load(),
      child: MaterialApp.router(
        title: 'Generated app',
        theme: ThemeData(colorSchemeSeed: Colors.teal),
        routerConfig: appRouter,
      )));
  }
}
