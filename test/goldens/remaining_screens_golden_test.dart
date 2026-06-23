import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fahs/generated/screens/home_screen.dart';
import 'package:fahs/generated/screens/phone_input_screen.dart';
import 'package:fahs/generated/screens/splash_screen.dart';

import 'golden_screen_host.dart';

class _GoldenCase {
  final String name;
  final String caption;
  final Widget child;

  const _GoldenCase({
    required this.name,
    required this.caption,
    required this.child,
  });
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final cases = <_GoldenCase>[
    const _GoldenCase(
      name: 'splash_screen',
      caption: 'Splash',
      child: SplashScreen(),
    ),
    const _GoldenCase(
      name: 'phone_input_screen',
      caption: 'Phone Input',
      child: PhoneInputScreen(),
    ),
    const _GoldenCase(
      name: 'home_screen',
      caption: 'Home',
      child: HomeScreen(),
    ),
  ];

  for (final testCase in cases) {
    testWidgets('${testCase.name} matches the prototype golden',
        (tester) async {
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.binding.setSurfaceSize(const Size(440, 980));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        GoldenScreenHost(
          caption: testCase.caption,
          child: testCase.child,
        ),
      );
      await tester.pump();

      expect(tester.takeException(), isNull);
      await expectLater(
        find.byType(GoldenScreenHost),
        matchesGoldenFile('${testCase.name}.png'),
      );
    });
  }
}
