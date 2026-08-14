// [generated] generator=ProjectGenerator template=widget_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_expense_tracker/main.dart';

void main() {
  testWidgets('generated app renders', (tester) async {
    await tester.pumpWidget(const ReplicaApp());
    expect(find.text('Generated app'), findsOneWidget);
    expect(find.text('Transaction'), findsWidgets);
  });
}
