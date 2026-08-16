// [generated] generator=AttachmentTestGenerator template=attachment_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_ledgerly/generated.dart';

void main() {
  test('synthesizeAttachment is deterministic and yields a well-formed attachment', () {
    final a = synthesizeAttachment('slip-001');
    final b = synthesizeAttachment('slip-001');
    final c = synthesizeAttachment('slip-002');
    expect(a.path, b.path, reason: 'same seed must yield the same synthetic path');
    expect(a.checksum, b.checksum, reason: 'same seed must yield the same checksum');
    expect(a.path, isNot(c.path), reason: 'different seed must yield a different path');
    expect(a.checksum, isNotEmpty);
    expect(a.sizeBytes, greaterThan(0));
    expect(a.mimeType, 'image/jpeg');
    final roundtrip = ReceiptAttachment.fromJson(a.toJson());
    expect(roundtrip.checksum, a.checksum, reason: 'toJson/fromJson must round-trip the checksum');
  });

  test('ReceiptOcrPort is implemented by a deterministic mock', () async {
    final port = MockReceiptOcr() as ReceiptOcrPort;
    final result = await port.extract(synthesizeAttachment('slip-002'));
    expect(result.merchant, 'Sample Merchant');
    expect(result.total, 42.50);
    expect(result.currency, 'SAR');
    expect(result.confidence['merchant'], lessThan(kLowOcrConfidence), reason: 'the mock must exercise the low-confidence path MF3 ships');
    expect(result.confidence['total'], greaterThan(kLowOcrConfidence), reason: 'not every field is low-confidence — only merchant');
  });

  test('MockReceiptOcr output is stable across calls', () async {
    final port = MockReceiptOcr();
    final first = await port.extract(synthesizeAttachment('slip'));
    final second = await port.extract(synthesizeAttachment('slip'));
    expect(first.rawText, second.rawText);
    expect(first.date, second.date);
  });
}
