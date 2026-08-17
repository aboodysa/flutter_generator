// [generated] generator=UnitTestGenerator template=unit_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_expense/generated.dart';

void main() {
  test('TransactionEntityModel fromJson/toJson round-trips without throwing', () {
    final json = <String, dynamic>{
        'id': 'x',
        'accountId': 'x',
        'userId': 'x',
        'amount': {'minorUnits': 0, 'currency': 'SAR'},
        'transactionDateTime': '2024-01-01T00:00:00.000Z',
        'transactionType': 'x',
        'captureMethod': 'x',
        'isDigitalReceipt': false,
        'createdAt': '2024-01-01T00:00:00.000Z',
        'cycleId': null,
        'categoryId': null,
        'merchantId': null,
        'merchant': null,
        'branchName': null,
        'vatAmount': null,
        'discountAmount': null,
        'totalQty': null,
        'invoiceNumber': null,
        'taxNumber': null,
        'terminalCode': null,
        'commercialRegisterNumber': null,
        'paymentMethod': null,
        'paymentMethodMap': null,
        'cashierName': null,
        'salesName': null,
        'customerName': null,
        'customerPhone': null,
        'notes': null,
        'qrCode': null,
        'subtotal': null,
        'taxableAmount': null,
        'totalSavings': null,
        'usedCredit': null,
        'netPayable': null,
        'categoryName': null,
        'sectionCode': null,
        'sectionIconIndex': null,
        'categoryIconAsset': null,
        'categoryColorHex': null,
        'captureMethodIconAsset': null,
        'nfcTransactionCode': null,
        'isLongReceipt': null,
    };
    final m = TransactionEntityModel.fromJson(json);
    expect(m.toJson(), isNotEmpty);
  });

  test('TransactionEntity equality by identity', () {
    final a = TransactionEntity(id: 'x', accountId: 'x', userId: 'x', amount: Money(minorUnits: 0, currency: 'SAR'), transactionDateTime: DateTime(2024), transactionType: 'x', captureMethod: 'x', isDigitalReceipt: false, createdAt: DateTime(2024));
    expect(a, equals(a));
  });
}
