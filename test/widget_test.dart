import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fahs/app/app.dart';
import 'package:fahs/app/router.dart';
import 'package:fahs/design_system/design_system.dart';
import 'package:fahs/generated/app/router.g.dart';

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

  testWidgets('Debug screen picker opens generated screens', (tester) async {
    await tester.pumpWidget(const FahsApp());
    await tester.pumpAndSettle();

    expect(find.text('Screen Picker'), findsOneWidget);
    expect(find.text('Phone Input'), findsOneWidget);

    await tester.tap(find.text('Phone Input'));
    await tester.pumpAndSettle();

    expect(find.text('رقم الهاتف'), findsOneWidget);
  });

  testWidgets('All generated screens render without framework exceptions',
      (tester) async {
    await tester.pumpWidget(const FahsApp());
    await tester.pumpAndSettle();

    for (final screen in generatedScreenEntries) {
      appRouter.goNamed(screen.screenId);
      await tester.pumpAndSettle();

      final exception = tester.takeException();
      expect(
        exception,
        isNull,
        reason: 'Generated screen failed to render: ${screen.screenId}',
      );
    }
  });

  testWidgets('AppBanner lays out inside horizontal scroll views',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                AppBanner.peach(
                  title: 'نقل ملكية مركبة',
                  subtitle: 'قدم طلب نقل ملكية لمركبتك الآن',
                ),
                SizedBox(width: 12),
                AppBanner(
                  title: 'حجز فحص المركبة',
                  subtitle: 'احجز موعد الفحص الآن',
                ),
              ],
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('نقل ملكية مركبة'), findsOneWidget);
    expect(find.text('حجز فحص المركبة'), findsOneWidget);
  });

  testWidgets('AppCard lays out inside horizontal rows', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                AppCard.peach(
                  child: Text('نقل الملكية', style: AppTextStyles.title),
                ),
                const SizedBox(width: 12),
                AppCard.lavender(
                  child: Text('فحص السيارة', style: AppTextStyles.title),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('نقل الملكية'), findsOneWidget);
    expect(find.text('فحص السيارة'), findsOneWidget);
  });

  testWidgets('AppTopBar back button does not pop root route', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Directionality(
          textDirection: TextDirection.rtl,
          child: Scaffold(
            appBar: AppTopBar(title: 'عنوان', showBack: true),
            body: SizedBox.shrink(),
          ),
        ),
      ),
    );

    final backIcon = find.byIcon(Icons.arrow_back);
    expect(backIcon, findsOneWidget);
    expect(tester.getCenter(backIcon).dx,
        greaterThan(tester.getCenter(find.text('عنوان')).dx));

    await tester.tap(backIcon);
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('عنوان'), findsOneWidget);
  });

  testWidgets('AppTextField keeps trailing action and indicator in RTL order',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Directionality(
          textDirection: TextDirection.rtl,
          child: Scaffold(
            body: Center(
              child: SizedBox(
                width: 360,
                child: AppTextField(
                  label: 'كود الخصم',
                  placeholder: 'ادخل كود الخصم',
                  prefix: Icon(Icons.local_offer_outlined),
                  suffix: Text('تفعيل'),
                ),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    final action = find.text('تفعيل');
    final indicator = find.byIcon(Icons.local_offer_outlined);
    final label = find.text('كود الخصم');

    expect(action, findsOneWidget);
    expect(indicator, findsOneWidget);
    expect(label, findsOneWidget);
    expect(tester.getCenter(action).dx,
        greaterThan(tester.getCenter(indicator).dx));
    expect(tester.getCenter(label).dx,
        greaterThan(tester.getCenter(indicator).dx));
  });

  testWidgets('AppTextField aligns its label with directional start',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Directionality(
          textDirection: TextDirection.rtl,
          child: Scaffold(
            body: Center(
              child: SizedBox(
                width: 360,
                child: AppTextField(
                  label: 'المبلغ',
                  placeholder: 'أدخل المبلغ',
                ),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    final labelAlign = find.byWidgetPredicate((w) =>
        w is Align && w.alignment == AlignmentDirectional.centerStart);
    final labelText = tester.widget<Text>(find.text('المبلغ'));

    expect(labelAlign, findsOneWidget);
    expect(labelText.textAlign, TextAlign.start);
  });

  testWidgets('AppPhoneField aligns its label with directional start',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Directionality(
          textDirection: TextDirection.rtl,
          child: Scaffold(
            body: Center(
              child: SizedBox(
                width: 360,
                child: AppPhoneField(
                  label: 'رقم الهاتف',
                  placeholder: 'أدخل رقم الهاتف',
                ),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    final labelAlign = find.byWidgetPredicate((w) =>
        w is Align && w.alignment == AlignmentDirectional.centerStart);
    final labelText = tester.widget<Text>(find.text('رقم الهاتف'));

    expect(labelAlign, findsOneWidget);
    expect(labelText.textAlign, TextAlign.start);
  });

  testWidgets('PaymentMethodList aligns its label with directional start',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Directionality(
          textDirection: TextDirection.rtl,
          child: Scaffold(
            body: PaymentMethodList(
              label: 'طرق الدفع',
              methods: [
                PaymentMethodOption(id: 'card', label: 'بطاقة', icon: 'card'),
              ],
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    final labelAlign = find.byWidgetPredicate((w) =>
        w is Align && w.alignment == AlignmentDirectional.centerStart);
    final labelText = tester.widget<Text>(find.text('طرق الدفع'));

    expect(labelAlign, findsOneWidget);
    expect(labelText.textAlign, TextAlign.start);
  });

  testWidgets('PaymentMethodList changes selection on tap', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Directionality(
          textDirection: TextDirection.rtl,
          child: Scaffold(
            body: PaymentMethodList(
              label: 'طرق الدفع',
              methods: [
                PaymentMethodOption(
                  id: 'card',
                  label: 'دفع إلكتروني فيزا - ماستر',
                  icon: 'card',
                ),
                PaymentMethodOption(
                  id: 'mada',
                  label: 'مدى mada',
                  icon: 'mada',
                ),
                PaymentMethodOption(
                  id: 'wallet',
                  label: 'المحفظة',
                  balance: '١٢٥ ر.س',
                ),
              ],
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    final firstRowRadio = find.byIcon(Icons.radio_button_off).first;
    final firstRowIcon = find.byIcon(Icons.credit_card_rounded);
    final firstRowLabel = find.text('دفع إلكتروني فيزا - ماستر');

    expect(tester.getCenter(firstRowRadio).dx,
        greaterThan(tester.getCenter(firstRowIcon).dx));
    expect(tester.getCenter(firstRowIcon).dx,
        greaterThan(tester.getCenter(firstRowLabel).dx));

    await tester.tap(find.text('مدى mada'));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.byIcon(Icons.radio_button_checked), findsOneWidget);
  });
}
