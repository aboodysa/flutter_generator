import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fahs/app/app.dart';

void main() {
  testWidgets('App starts and renders initial screen', (tester) async {
    await tester.pumpWidget(const FahsApp());
    await tester.pumpAndSettle();

    expect(find.byType(MaterialApp), findsOneWidget);
  });

  testWidgets('Directionality is RTL', (tester) async {
    await tester.pumpWidget(const FahsApp());

    final rtlDirectionality = find.byWidgetPredicate(
      (w) => w is Directionality && w.textDirection == TextDirection.rtl,
    );
    expect(rtlDirectionality, findsAtLeast(1));
  });

  testWidgets('App scaffold renders without errors', (tester) async {
    await tester.pumpWidget(const FahsApp());
    await tester.pump();

    expect(tester.takeException(), isNull);
  });
}
