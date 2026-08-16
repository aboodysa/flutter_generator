/**
 * AttachmentCoreGenerator — structural, deterministic, 0% LLM (MF3).
 * Emits `core/attachment.dart` once per app that declares >=1 attachment-capable field
 * (operations.ts's hasAttachments — added once MF2's in-flight edits to operations.ts land,
 * see the coordination note in this session's report). Mirrors L2/MF4's precedent: a single
 * shared, app-type-agnostic module, not per-entity generation — nothing here depends on any
 * entity-specific field beyond the generic ReceiptAttachment/OcrResult shapes.
 *
 * Deliberately does NOT wire a real file-picker (image_picker/file_picker) or ML Kit/platform OCR
 * — both are platform integrations out of scope for a deterministic, offline, 0%-LLM generator.
 * The "Attach" action (synthesizeAttachment) and MockReceiptOcr are the runtime for now, the same
 * documented posture ROADMAP.md's P12 already takes for MockPaymentGateway ("mock is the runtime
 * until a real provider is wired" — not silently pretended-real).
 */
export function generateAttachmentCore(): string {
  return `// [generated] generator=AttachmentCoreGenerator template=attachment_core.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.

// MF3: attachment + OCR port — offline-first, 0% LLM. See this file's own doc comment in the
// generator source for why no real file-picker/ML-Kit plugin is wired.
const double kLowOcrConfidence = 0.7;

class ReceiptAttachment {
  const ReceiptAttachment({
    required this.path,
    required this.checksum,
    required this.sizeBytes,
    required this.mimeType,
  });

  final String path;
  final String checksum;
  final int sizeBytes;
  final String mimeType;

  factory ReceiptAttachment.fromJson(Map<String, dynamic> json) => ReceiptAttachment(
        path: json['path'] as String,
        checksum: json['checksum'] as String,
        sizeBytes: json['sizeBytes'] as int,
        mimeType: json['mimeType'] as String,
      );

  Map<String, dynamic> toJson() => {
        'path': path,
        'checksum': checksum,
        'sizeBytes': sizeBytes,
        'mimeType': mimeType,
      };
}

class OcrResult {
  const OcrResult({
    this.merchant,
    this.date,
    this.total,
    this.currency,
    this.confidence = const {},
    this.rawText = '',
  });

  final String? merchant;
  final DateTime? date;
  final double? total;
  final String? currency;
  final Map<String, double> confidence;
  final String rawText;
}

abstract class ReceiptOcrPort {
  Future<OcrResult> extract(ReceiptAttachment attachment);
}

// Deterministic, fixed result regardless of input — the runtime OCR provider until a real
// ML Kit/platform port is wired. 'merchant' confidence is deliberately BELOW kLowOcrConfidence so
// the low-confidence UI path is exercised by this one mock result, without needing a second case.
class MockReceiptOcr implements ReceiptOcrPort {
  @override
  Future<OcrResult> extract(ReceiptAttachment attachment) async {
    return OcrResult(
      merchant: 'Sample Merchant',
      date: DateTime(2026, 1, 15),
      total: 42.50,
      currency: 'SAR',
      confidence: const {'merchant': 0.55, 'total': 0.92, 'date': 0.88},
      rawText: 'SAMPLE MERCHANT\\n15/01/2026\\nTOTAL: 42.50 SAR',
    );
  }
}

// Deterministic local "attach" action — synthesizes a ReceiptAttachment without a real OS file
// picker (no image_picker/file_picker dependency; keeps the generator fully offline/deterministic
// under CDP). The checksum is a deterministic hash of the synthetic path, not a real file digest.
ReceiptAttachment synthesizeAttachment(String seedName) {
  final path = 'local://receipts/\$seedName';
  final checksum = path.hashCode.toRadixString(16);
  return ReceiptAttachment(path: path, checksum: checksum, sizeBytes: 102400, mimeType: 'image/jpeg');
}
`;
}
