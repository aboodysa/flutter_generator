import { readFileSync } from 'fs';
import { resolve } from 'path';
import { listGeneratedFiles, verifyGeneratedFile } from '../tools/verify_generated';

type SnapshotRule = {
  source: string;
  patterns: RegExp[];
};

function summaryFor(source: string, patterns: RegExp[]): string {
  const matches: Array<{ index: number; value: string }> = [];

  for (const pattern of patterns) {
    if (pattern.global) {
      const globalPattern = new RegExp(pattern.source, pattern.flags);
      for (const match of source.matchAll(globalPattern)) {
        if (match[0].trim().length > 0) {
          matches.push({ index: match.index ?? 0, value: match[0].trim() });
        }
      }
      continue;
    }

    const match = source.match(pattern);
    if (match && match[0].trim().length > 0) {
      const index = match.index ?? source.indexOf(match[0]);
      matches.push({ index, value: match[0].trim() });
    }
  }

  return matches
    .sort((left, right) => left.index - right.index)
    .map(entry => entry.value)
    .join('\n');
}

describe('Generated Flutter Snapshots', () => {
  const repoRoot = resolve(__dirname, '..');
  const rules: SnapshotRule[] = [
    {
      source: 'splash_screen.dart',
      patterns: [
        /class SplashScreen\b/,
        /return AppScaffold\(/,
        /const SplashHero\(\)/,
      ],
    },
    {
      source: 'phone_input_screen.dart',
      patterns: [
        /class PhoneInputScreen\b/,
        /return AppScaffold\(/,
        /AppTopBar\(title: '', showBack: true\)/,
        /Text\('رقم الهاتف', style: AppTextStyles\.heading, textAlign: TextAlign\.start\)/,
        /Text\('سوف نرسل ٤ أرقام لهاتفك المحمول للتأكد', style: AppTextStyles\.bodyRegular.*textAlign: TextAlign\.start\)/,
        /AppPhoneField\(label: '', placeholder: '051234321'\)/,
        /AppButton\.primary\(/,
        /AppActionDispatcher\.dispatch\(/,
      ],
    },
    {
      source: 'home_screen.dart',
      patterns: [
        /class HomeScreen\b/,
        /return AppScaffold\(/,
        /const LogoHeader\(\)/,
        /AppBanner\.peach\(title: 'نقل ملكية مركبة', subtitle: 'قدم طلب نقل ملكية لمركبتك الآن'\)/,
        /AppBanner\(title: 'حجز فحص المركبة', subtitle: 'احجز موعد الفحص الآن'\)/,
        /Text\('الطلبات', style: AppTextStyles\.title\)/,
        /Text\('عرض الكل', style: AppTextStyles\.caption\)/,
        /OrderCard\(/g,
        /vehicleName: 'تويوتا كورولا ٢٠٢٤',/g,
        /date: 'أرسل في 10 يونيو 2024',/g,
        /Text\('الخدمات', style: AppTextStyles\.title\)/,
        /AppCard\.peach\(/,
        /AppCard\.lavender\(/,
        /AppBottomNav\(/,
      ],
    },
    {
      source: 'payment_screen.dart',
      patterns: [
        /class PaymentScreen\b/,
        /return AppScaffold\(/,
        /AppTopBar\(title: 'فحص المركبة', showBack: true\)/,
        /SummaryBanner\(title: 'مركز الفاحص بالقادسية', subtitle: 'تويوتا كورولا ٢٠٢٤، فحص شامل', price: '٥٠ ريال'\)/,
        /AppPhoneField\(label: 'رقم صاحب السيارة', placeholder: '\+0598777733'\)/,
        /AppTextField\(label: 'كود الخصم', placeholder: 'ادخل كود الخصم',/,
        /prefix: const Icon\(Icons\.local_offer_outlined, size: 16, color: AppColors\.textMuted\)/,
        /suffix: Text\('تفعيل', style: AppTextStyles\.label\.copyWith\(color: AppColors\.primary\)\)\)/,
        /PaymentMethodList\(/,
        /PaymentMethodOption\(id: 'card', label: 'دفع إلكتروني فيزا - ماستر', icon: 'card'\)/,
        /PaymentMethodOption\(id: 'mada', label: 'مدى mada', icon: 'mada'\)/,
        /PaymentMethodOption\(id: 'wallet', label: 'المحفظة', balance: '١٢٥ ر\.س'\)/,
        /PaymentMethodOption\(id: 'tamara', label: 'قسمها على ٤ دفعات بـ ٣٣\.٣ ر\.س', icon: 'tamara'\)/,
        /FixedActionBar\(/,
        /AppActionDispatcher\.dispatch\(/,
      ],
    },
  ];

  for (const rule of rules) {
    test(`${rule.source} matches the snapshot`, () => {
      const filePath = resolve(repoRoot, 'lib', 'generated', 'screens', rule.source);
      const source = readFileSync(filePath, 'utf-8');
      const actual = summaryFor(source, rule.patterns);
      const expected = readFileSync(
        resolve(repoRoot, 'test', 'snapshots', rule.source + '.snapshot.txt'),
        'utf-8',
      ).trim();
      expect(actual).toBe(expected);
    });
  }

  test('generated Dart files pass static verification', () => {
    for (const fileName of listGeneratedFiles()) {
      expect(verifyGeneratedFile(fileName)).toEqual([]);
    }
  });
});
