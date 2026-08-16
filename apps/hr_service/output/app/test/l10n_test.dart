// [generated] generator=L10nTestGenerator template=l10n_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_hr_service/core/di.dart';import 'package:rasheed_replica_hr_service/generated.dart';
import 'package:rasheed_replica_hr_service/core/theme.dart';
import 'package:rasheed_replica_hr_service/core/app_strings.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

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

  testWidgets('AppStrings.of swaps strings per locale', (tester) async {
    Widget wrap(Locale locale) => MaterialApp(
      locale: locale,
      supportedLocales: const [Locale('en'), Locale('ar')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: Builder(builder: (context) => Text(AppStrings.of(context).save)),
    );

    await tester.pumpWidget(wrap(const Locale('en')));
    await tester.pumpAndSettle();
    expect(find.text('Save'), findsOneWidget);

    await tester.pumpWidget(wrap(const Locale('ar')));
    await tester.pumpAndSettle();
    expect(find.text('حفظ'), findsOneWidget);
  });

  testWidgets('LeaveRequestListScreen flips Directionality per locale, no RTL overflow, AR+EN goldens', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(BlocProvider<LeaveRequestListCubit>(
        create: (_) => sl<LeaveRequestListCubit>()..load(),
        child: MaterialApp(
          locale: const Locale('en'),
      supportedLocales: const [Locale('en'), Locale('ar')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
          theme: buildTheme(),
          home: LeaveRequestListScreen(),
        ),
      ));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'no RenderFlex overflow or other error under EN/LTR');
    expect(Directionality.of(tester.element(find.byType(LeaveRequestListScreen))), TextDirection.ltr);
    await expectLater(find.byType(LeaveRequestListScreen), matchesGoldenFile('goldens/l10n_en.png'));

    await tester.pumpWidget(BlocProvider<LeaveRequestListCubit>(
        create: (_) => sl<LeaveRequestListCubit>()..load(),
        child: MaterialApp(
          locale: const Locale('ar'),
      supportedLocales: const [Locale('en'), Locale('ar')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
          theme: buildTheme(),
          home: LeaveRequestListScreen(),
        ),
      ));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'no RenderFlex overflow or other error under AR/RTL');
    expect(Directionality.of(tester.element(find.byType(LeaveRequestListScreen))), TextDirection.rtl);
    await expectLater(find.byType(LeaveRequestListScreen), matchesGoldenFile('goldens/l10n_ar.png'));
  });

  testWidgets('AuthLoginScreen flips Directionality per locale, no RTL overflow, AR+EN goldens', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    Widget wrapLogin(Locale locale) => MaterialApp(
      locale: locale,
      supportedLocales: const [Locale('en'), Locale('ar')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: buildTheme(),
      home: const AuthLoginScreen(),
    );

    await tester.pumpWidget(wrapLogin(const Locale('en')));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'no RenderFlex overflow or other error under EN/LTR');
    expect(find.text('Sign in'), findsOneWidget);
    expect(Directionality.of(tester.element(find.byType(AuthLoginScreen))), TextDirection.ltr);
    await expectLater(find.byType(AuthLoginScreen), matchesGoldenFile('goldens/l10n_login_en.png'));

    await tester.pumpWidget(wrapLogin(const Locale('ar')));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'no RenderFlex overflow or other error under AR/RTL');
    expect(find.text('تسجيل الدخول'), findsOneWidget);
    expect(Directionality.of(tester.element(find.byType(AuthLoginScreen))), TextDirection.rtl);
    await expectLater(find.byType(AuthLoginScreen), matchesGoldenFile('goldens/l10n_login_ar.png'));
  });
}
