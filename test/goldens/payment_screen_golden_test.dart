import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fahs/generated/screens/payment_screen.dart';
import 'golden_screen_host.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Payment screen matches the prototype golden', (tester) async {
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.binding.setSurfaceSize(const Size(440, 980));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      const GoldenScreenHost(
        caption: 'Payment',
        child: PaymentScreen(),
      ),
    );
    await tester.pump();

    expect(tester.takeException(), isNull);
    await expectLater(
      find.byType(GoldenScreenHost),
      matchesGoldenFile('payment_screen.png'),
    );
  });
}
