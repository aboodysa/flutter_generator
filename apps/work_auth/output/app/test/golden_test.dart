// [generated] generator=GoldenTestGenerator template=golden_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_work_auth/core/di.dart';import 'package:rasheed_replica_work_auth/generated.dart';
import 'package:rasheed_replica_work_auth/core/theme.dart';
import 'package:flutter/material.dart';

void main() {
  setUpAll(() async {
    final font = FontLoader('Roboto');
    for (final f in const ['Roboto-Regular', 'Roboto-Medium', 'Roboto-Bold']) {
      font.addFont(rootBundle.load('assets/fonts/$f.ttf'));
    }
    await font.load();
    final icons = FontLoader('MaterialIcons')
      ..addFont(rootBundle.load('assets/fonts/MaterialIcons-Regular.otf'));
    await icons.load();
  });

  testWidgets('WorkAuthListScreen renders (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<WorkAuthListCubit>(
      create: (_) => sl<WorkAuthListCubit>()..load(),
      child: MaterialApp(theme: buildTheme(), home: WorkAuthListScreen()),
    ));
    await tester.pumpAndSettle();
    await expectLater(find.byType(WorkAuthListScreen), matchesGoldenFile('goldens/work_auth_list_screen.png'));
  });

}
