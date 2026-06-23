import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'package:fahs/core/theme/theme.dart';

class GoldenScreenHost extends StatelessWidget {
  final Widget child;
  final String caption;

  const GoldenScreenHost({
    super.key,
    required this.child,
    required this.caption,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: ThemeData(
        fontFamily: 'Tajawal',
        fontFamilyFallback: const ['Roboto'],
      ),
      builder: (context, child) {
        final mediaQuery = MediaQuery.of(context);
        return MediaQuery(
          data: mediaQuery.copyWith(
            textScaler: const TextScaler.linear(1.0),
          ),
          child: child!,
        );
      },
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
                  child: _GoldenDeviceFrame(
                    child: child,
                  ),
                ),
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 24,
                  child: Text(
                    caption,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
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

class _GoldenDeviceFrame extends StatelessWidget {
  final Widget child;

  const _GoldenDeviceFrame({required this.child});

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
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.signal_cellular_alt, size: 13, color: Colors.black),
                SizedBox(width: 4),
                Icon(Icons.wifi, size: 13, color: Colors.black),
                SizedBox(width: 4),
                Icon(Icons.battery_full, size: 14, color: Colors.black),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
