# ChatGPT review — VLM Design→IR Contract v1 → ADOPT WITH MODIFY (2026-08-18)

> Owner forwarded ChatGPT's reply verbatim. This file is the record; the revised contract
> (`VLM_DESIGN_TO_IR_CONTRACT_V2.md`) is produced by the Claude Opus product-planning lane
> incorporating these points.

---

هذا الـ Contract جيد جداً كـ VLM → IR boundary، لكنه يحتاج عدة تعديلات قبل أن أعتبره Contract جاهزاً للتنفيذ. أهم نقطة: حالياً هو أقوى في وصف semantic extraction من screenshot، لكنه ما زال يفترض أن بعض الأشياء يمكن استنتاجها بثقة أكبر مما يسمح به screenshot فعلي.

**قراري: ADOPT WITH MODIFY** — وليس Adopt كما هو.

أقترح تثبيت 6 تعديلات:

1. أضف confidence/provenance لكل قرار مستنتج من الصورة
2. افصل observed عن inferred
3. لا تجعل sections[] مجرد قائمة؛ أضف parentage/relationships عند الحاجة
4. لا تجعل emphasis قيمة حرة؛ يجب أن تكون reference إلى section/component ID
5. افصل AssetRequest عن asset resolution تماماً
6. أضف evidence region/property confidence للـ VLM

## 1. أهم نقص: الصورة ليست Ground Truth

الجملة "the IR, not the screenshot, is the source of truth" صحيحة بعد human approval، لكنها ليست صحيحة في مرحلة الاستخراج. الـ VLM لا يعرف يقيناً أن الشاشة responsive، أو أن الـ carousel auto-playing، أو أن الـ card grid بالضبط 2 columns، أو أن الـ banner 16:9، أو أن brandSeedColor هو اللون الحقيقي للـ design system، أو أن الـ map عنصر حي وليس مجرد صورة، أو أن الـ status machine تحتوي تحديداً على هذه الحالات.

لذلك يجب أن يكون هناك فرق:

```
Observed
Inferred
Proposed
Approved
```

مثلاً:

```yaml
visualStyle:
  personality:
    value: friendly
    confidence: 0.82
    origin: llm-inferred
```

لكن:

```yaml
sections:
  - section: heroBanner
    confidence: 0.99
    evidence: screenshot-region
```

## 2. لا تسمح للـ VLM بإنتاج emphasis مثل "heroBanner" مباشرة

الفكرة صحيحة، لكن الأفضل:

```yaml
emphasis:
  target: heroBanner
```

أو حتى:

```yaml
emphasis:
  targetId: section.hero
```

لأن heroBanner هنا يجب أن يكون stable semantic ID وليس مجرد catalog type.

```yaml
sections:
  - id: primaryHero
    section: heroBanner
  - id: offers
    section: productGrid
visualStyle:
  emphasis: primaryHero
```

بهذا يصبح VisualIntent → scoring قابلاً للتتبع.

## 3. sections[] تحتاج Parentage

القائمة الحالية ممتازة كبداية لكنها لا تستطيع التعبير عن تصميمات أكثر تعقيداً:

```
Home
 ├── Header
 ├── Search
 ├── Hero
 └── Offers
      ├── SectionHeader
      └── ProductGrid
           └── ProductCard
```

لذلك S2 يجب أن يحسم هل الـ IR سيكون:

```yaml
sections:
  - id: offers
    section: productSection
    children:
      - sectionHeader
      - productGrid
```

أو flat list مع references. أنا أفضل nested semantic composition، لكن مع منع arbitrary widget trees.

## 4. الـ AssetRequest ممتازة — لا توسعها الآن

هذا الجزء من أفضل أجزاء العقد:

```json
{
  "id": "baked_bread_hero",
  "type": "illustration",
  "semanticRole": "grocery_delivery",
  "style": "friendly_3d",
  "aspectRatio": "16:9",
  "background": "transparent"
}
```

والـ boundary يجب أن يبقى:

```
VLM → AssetRequest → Asset Planner → Existing Asset → Library → Procedural → AI Asset [Phase 4]
```

VLM لا يعرف path ولا URL ولا filename. هذا صحيح تماماً.

## 5. brandSeedColor يحتاج special handling

السماح للـ VLM بـ `"brandSeedColor": "#0EA5A4"` جيد لأنه استثناء واحد، لكن screenshot قد يحتوي compression / shadows / gradients / anti-aliasing / image colors / overlays. لذلك يجب أن يكون:

```yaml
brandSeedColor:
  value: "#0EA5A4"
  confidence: 0.94
  evidence: dominant_ui_chrome
  requiresApproval: true
```

والـ compiler يجب أن يرفض أي hex آخر.

## 6. أهم إضافة: Evidence

أنت تريد أن يكون VLM قادراً على قول "رأيت هذا في الصورة" بدلاً من مجرد "أعتقد أن التصميم هكذا":

```yaml
observations:
  - target: primaryHero
    property: type
    value: heroBanner
    confidence: 0.97
    evidence:
      region: [42, 180, 708, 420]
```

ولا يعني هذا أن الـ compiler يستخدم coordinates. **الإحداثيات هنا evidence فقط، وليست layout instructions.**

**Evidence coordinates ≠ layout coordinates** — الـ VLM يستطيع استخدام الصورة لإثبات أين رأى شيئاً، بينما الـ compiler ممنوع من استخدام هذه الإحداثيات للرسم.

## 7. الـ provenance model المقترح

```yaml
field:
  value: rounded
  origin: llm-inferred
  confidence: 0.91
  evidence: screenshot-region
  requiresApproval: true
```

وبعد human approval:

```yaml
field:
  value: rounded
  origin: human-attested
  confidence: 1.0
  requiresApproval: false
```

وهذا يتماشى مباشرة مع الـ trust boundary الموجود:

```
LLM inference → schema validation → human approval → compiler truth
```

## 8. مشكلة صغيرة في Worked Example A

`"type": "market"` مكتوب "archetype for a commercial home (proposed)" — هذا يجب ألا يدخل إلى الـ VLM contract كأنه catalog type نهائي قبل أن يحسمه S2.

الأفضل حالياً `"type": "dashboard"` أو archetype موجود فعلياً إذا كان الـ current IR يدعمه. إذا احتجتم market فعلاً:

```
S2 proves market archetype → catalog addition → contract update
```

وليس العكس.

## 9. productGrid أيضاً يجب ألا يعني تلقائياً "2 columns"

الـ VLM يرى 2-column grid في screenshot، لكن الـ IR يجب أن يقول `section: productGrid` ثم responsive policy + available width + component min width + design tokens تحدد:

```
320 → 1
390 → 2
1400 → N
```

وهذا يحافظ على المبدأ الأساسي: **Screenshot geometry is evidence, not layout instructions.**

## 10. الـ acceptance checks تحتاج إضافة واحدة مهمة

حالياً: "Every referenced field exists…"

أضف:
- Every inferred property has provenance + confidence.
- No inferred value may silently become compiler truth.

أي أن LLM-inferred لا يمكن أن يتحول إلى approved إلا عبر الـ approval mechanism.

## الشكل النهائي

أصبح الـ pipeline:

```
Screenshot / Figma
        │
        ▼
      VLM
        │
        ├── semantic observations
        ├── inferred intent
        ├── section structure
        ├── asset requests
        └── evidence + confidence
        │
        ▼
 Schema Validation
        │
        ▼
 Semantic IR  (origin = llm-inferred)
        │
        ▼
 Human Approval
        │
        ▼
 IR  (origin = human-attested)
        │
        ▼
 GenerationPlan
        │
        ├── Token Resolver
        ├── Component Resolver
        ├── Asset Planner
        └── Layout Compiler
        │
        ▼
 Flutter
        │
        ▼
 Deterministic Validators
        │
        ▼
 Human Goldens
```

وهذا أقوى من مجرد "VLM يحول screenshot إلى JSON". أنت فعلياً تبني **Design Reverse Compiler**: Visual evidence → semantic design grammar → deterministic UI compiler. وهذا يتماشى مع القرار: الـ LLM/VLM semantic decision-maker فقط، بينما الـ compiler هو صاحب الحقيقة والتنفيذ.