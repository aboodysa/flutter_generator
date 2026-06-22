import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fahs/core/theme/theme.dart';
import 'package:fahs/generated/screens/payment_screen.dart';

class _PaymentGoldenFrame extends StatelessWidget {
  const _PaymentGoldenFrame();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Directionality(
        textDirection: TextDirection.rtl,
        child: ColoredBox(
          color: Colors.white,
          child: SizedBox(
            width: 440,
            height: 980,
            child: Stack(
              children: [
                Positioned(
                  left: 25,
                  top: 40,
                  child: _DeviceFrame(
                    child: const PaymentScreen(),
                  ),
                ),
                const Positioned(
                  left: 0,
                  right: 0,
                  bottom: 24,
                  child: Text(
                    'Payment',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF6E6E6E),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DeviceFrame extends StatelessWidget {
  final Widget child;

  const _DeviceFrame({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 390,
      height: 844,
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: const Color(0xFF0B0B0D),
        borderRadius: BorderRadius.circular(48),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1F000000),
            blurRadius: 32,
            offset: Offset(0, 16),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(40),
        child: Stack(
          children: [
            Positioned.fill(
              child: Container(
                color: AppColors.background,
                padding: const EdgeInsets.only(top: 43),
                child: child,
              ),
            ),
            const Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: _StatusBar(),
            ),
            Positioned(
              top: 10,
              left: 145,
              child: Container(
                width: 106,
                height: 27,
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusBar extends StatelessWidget {
  const _StatusBar();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 43,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 22),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: const [
            Text(
              '13:13',
              textDirection: TextDirection.ltr,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: Colors.black,
              ),
            ),
            Text(
              '▮▮ ᯤ ▭',
              textDirection: TextDirection.ltr,
              style: TextStyle(
                fontSize: 13,
                color: Colors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Payment screen matches the prototype golden', (tester) async {
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.binding.setSurfaceSize(const Size(440, 980));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(const _PaymentGoldenFrame());
    await tester.pump();

    expect(tester.takeException(), isNull);
    await expectLater(
      find.byType(_PaymentGoldenFrame),
      matchesGoldenFile('payment_screen.png'),
    );
  });
}
