# آليَّة توليد الشاشات المرئية في المولّد

> Proposal handed by the owner for review by Claude (accept / reject / add spikes with priorities).
> Saved verbatim 2026-08-18. Review verdict lands in `VISUAL_GENERATION_REVIEW_BRIEF.md` + report.

## 1. الفكرة الأساسية

المولّد لا يجب أن يتعامل مع الشاشة على أنها مجرد مجموعة Widgets يتم ترتيبها بشكل عشوائي، بل يتعامل معها كـ Visual UI Specification تحتوي على:

* Layout
* Design Tokens
* Components
* Icons
* Images
* Backgrounds
* Illustrations
* Typography
* Colors
* Spacing
* States
* Content
* Visual hierarchy
* Interaction behavior

الهدف هو أن يستطيع المولّد إنتاج شاشة قريبة من مستوى التطبيقات التجارية الحقيقية، مثل شاشة Keemart، وليس مجرد شاشة Flutter صحيحة برمجياً.

## 2. Pipeline التوليد

```
Requirements / User Story
        ↓
Semantic Screen Model
        ↓
Visual Intent
        ↓
Design System Resolver
        ↓
Asset Planner
        ↓
Layout Planner
        ↓
Deterministic Renderer
        ↓
Flutter Code
        ↓
Visual Validation
        ↓
Repair / Regenerate
```

المهم أن الـ LLM لا يرسم الشاشة مباشرة.
الـ LLM يقوم بتحويل المتطلبات إلى قرارات منظمة، وبعد ذلك يقوم الـ compiler والمولّد بتنفيذ هذه القرارات بشكل deterministic.

## 3. Visual Intent

كل شاشة يجب أن يكون لها Visual Intent.

مثلاً:

```yaml
screen:
  type: order_tracking
  visualStyle:
    density: comfortable
    personality: friendly
    hierarchy: strong
    cornerRadius: rounded
    imagery: commercial
    emphasis: delivery_status
  theme:
    primary: brand
    background: neutral
    surface: white
    success: semantic.success
  assets:
    strategy: generated_or_library
  layout:
    strategy: responsive
```

الـ Visual Intent يحدد ما الذي نريد أن تبدو عليه الشاشة، وليس كيفية رسمها.

## 4. Design Tokens

قبل إنشاء أي Component، يقوم المولّد بحل الـ Design Tokens.

مثلاً:

```yaml
Color
Typography
Spacing
Radius
Elevation
Icon size
Image radius
Component height
Border width
```

مثال:

```yaml
tokens:
  spacing:
    xs: 4
    sm: 8
    md: 16
    lg: 24
    xl: 32
  radius:
    card: 20
    button: 14
    image: 16
  typography:
    title: headlineLarge
    body: bodyLarge
    caption: bodySmall
```

وبالتالي لا يقوم الـ LLM باختيار `padding = 17` / `radius = 13` / `fontSize = 21` بشكل عشوائي.
بل يختار `padding = spacing.md` / `radius = radius.card` / `typography = title`.

## 5. Asset Planner

هذه أهم طبقة لإنتاج الشاشات الغنية بصرياً.
المولّد يقرر لكل عنصر بصري:

```
Asset Type
      ↓
Existing Asset?
      ↓
Icon / Image / Illustration / Background
      ↓
Library / Generated / Procedural
```

مثلاً:

```yaml
asset:
  id: delivery_illustration
  type: illustration
  semanticRole: order_delivery
  source:
    strategy: generated
  constraints:
    aspectRatio: 1:1
    transparent: true
    style: friendly_3d
```

## 6. الأيقونات Icons

الأيقونات لا يتم توليدها بواسطة Image AI في الحالة الطبيعية.
الأولوية تكون:

1. Design System Icon
2. Material / Cupertino / Font Awesome
3. Project Icon Library
4. Custom SVG
5. Generated image ← آخر خيار

لأن الـ Icon يجب أن يكون:
* حاداً
* قابلاً للتكبير
* accessible
* consistent
* lightweight
* deterministic

مثلاً:

```yaml
icon:
  semantic: customer_support
  source: design_system
  variant: outlined
  size: 24
```

ثم يقوم الـ renderer بتحويله إلى Flutter:

```dart
Icon(Icons.support_agent)
```

أو إلى SVG asset إذا كان Custom.

## 7. الصور Images

الصور لها ثلاث استراتيجيات.

**A. Existing Asset** — إذا كان المشروع يحتوي على الصورة `assets/images/product.png` يتم استخدامها مباشرة.

**B. Asset Library** — إذا كان النظام يحتوي على مكتبة صور مناسبة (`food`, `grocery`, `delivery`, `profile`, `products`, `categories`) يتم اختيار الصورة المناسبة من الـ library.

**C. Generated Asset** — إذا لم توجد صورة مناسبة، يقوم Asset Generator بإنشاءها.

مثلاً:

```yaml
image:
  semanticRole: grocery_delivery
  style: commercial_product
  aspectRatio: 16:9
  background: transparent
```

ثم يتم حفظ الناتج كـ asset حقيقي في المشروع.
المهم: الصورة الناتجة تصبح جزءاً من الـ build artifact، وليست شيئاً يتم توليده أثناء تشغيل التطبيق.

## 8. Backgrounds

الخلفية لا يجب أن تكون دائماً صورة.
المولّد يختار بين:

```
Solid Color
Gradient
Pattern
Shape Composition
Illustration
Image
Generated Background
```

مثلاً شاشة Home:

```yaml
background:
  type: gradient
  colors:
    - brand.primary
    - brand.primaryDark
```

أما شاشة متجر:

```yaml
background:
  type: image
  asset: grocery_hero
  overlay:
    color: black
    opacity: 0.15
```

وبذلك يمكن للمولّد إنتاج شاشات مثل الصورة المرفقة التي تحتوي على Hero banner + promotional imagery + product imagery.

## 9. الصور المركبة Composition

ميزة مهمة جداً هي عدم الاعتماد على AI لإنتاج Banner كامل كل مرة.
بدلاً من "Generate entire banner" يمكن للمولّد بناء:

```
Banner
 ├── Background
 ├── Headline
 ├── Subtitle
 ├── Product Image
 ├── Decorative Shape
 └── CTA
```

مثلاً:

```yaml
banner:
  layout: promotional
  background:
    type: gradient
  content:
    title: "Ready For School"
    cta: "Shop Now"
  image:
    asset: school_products
  decorations:
    - sun
    - sign
```

وهذا يعطي نتائج أكثر deterministic وأسهل في التعديل.

## 10. Generated Illustrations

عندما يحتاج التصميم إلى Illustration غير موجودة في المكتبة، يستخدم المولّد AI Asset Generator.
لكن الـ prompt لا يكتبه المستخدم مباشرة.
الـ compiler يبني Prompt من الـ semantic specification:

```
semantic role
+ visual style
+ brand style
+ composition
+ aspect ratio
+ background requirement
+ color constraints
```

مثلاً:

> Friendly grocery delivery illustration, modern commercial mobile-app style, green brand palette, 3D soft shapes, single delivery box, transparent background, centered composition, 1:1.

ثم تحفظ النتيجة `assets/generated/delivery_illustration.webp` ويتم تسجيلها في Asset Manifest.

## 11. Asset Manifest

كل asset يتم توليده يجب أن يكون معروفاً للمولّد:

```yaml
assets:
  - id: delivery_illustration
    path: assets/generated/delivery_illustration.webp
    type: illustration
    semanticRole: delivery
  - id: school_banner
    path: assets/generated/school_banner.webp
    type: banner
    semanticRole: promotion
```

وهذا يعطي:
* reproducibility
* caching
* versioning
* validation
* reuse

بدلاً من أن يقوم المولّد بإعادة إنشاء الصورة في كل build.

## 12. Layout Generation

بعد تحديد الـ assets، يقوم Layout Planner ببناء الـ visual hierarchy.
مثلاً شاشة Keemart:

```
Screen
│
├── Header
│   ├── Back
│   ├── Logo
│   └── Delivery Time
│
├── Search
│
├── Hero Carousel
│
├── Discover More
│   └── Horizontal Cards
│
├── Weekly Offers
│   └── Product Cards
│
└── Floating Cart
```

هذه ليست Flutter Widgets بعد. هذه UI IR.
ثم يقوم الـ renderer بتحويلها إلى Flutter.

## 13. Component Selection

كل عنصر يتم اختياره من Component Catalog.
مثلاً: `HeroBanner`, `ProductCard`, `HorizontalCarousel`, `SectionHeader`, `SearchBar`, `OrderStatusCard`, `FloatingCart`, `DeliveryTimeline`.

الـ LLM لا يخترع Component جديداً إذا كان هناك Component موجود بالفعل.
القاعدة:

```
Existing Component        → Reuse
No suitable Component     → Composition
Still insufficient        → New Component Proposal
```

## 14. الشاشة الثانية في المثال

شاشة Order Tracking يمكن تمثيلها:

```yaml
screen:
  type: order_tracking
  sections:
    - type: map
      background:
        type: map
      overlay:
        type: order_status_banner
    - type: order_status
      state: preparing
    - type: delivery_address
    - type: customer_contact
    - type: delivery_instruction
    - type: store_summary
    - type: order_items
    - type: promotion_banner
    - type: support
```

ثم يقوم الـ renderer ببناء الشاشة.

## 15. State-aware Visual Generation

المظهر لا يكون ثابتاً فقط.
نفس الشاشة يمكن أن يكون لها: `Preparing`, `Picked Up`, `Out for Delivery`, `Delivered`, `Cancelled`, `Failed`.
والـ generator يربط الـ visual state بالـ state model.

مثلاً:

```yaml
order:
  status: preparing
  visual:
    progress: 2
    activeStep: preparing
    message: "Your order is being prepared"
```

وهذا يمنع الـ UI من أن يكون مجرد صورة ثابتة.

## 16. Responsive Generation

المولّد لا يولد Pixel Coordinates.
بدلاً من `x = 27, y = 412, width = 351` يولد constraints:

```yaml
padding = screen.md
card = fullWidth
imageRatio = 16/9
contentAlignment = center
```

ثم يتم حساب الحجم النهائي حسب:
`Screen Size` + `Safe Area` + `Text Size` + `RTL/LTR` + `Platform`

## 17. RTL

بما أن المولّد يستهدف تطبيقات عربية، يجب أن تكون الـ visual specification نفسها language-aware.

```yaml
direction:
  mode: locale
  ar:
    direction: rtl
  en:
    direction: ltr
```

ولا يتم إنشاء شاشة عربية عن طريق عكس الشاشة الإنجليزية يدوياً.
الـ components نفسها يجب أن تكون RTL-aware.

## 18. Visual Validation

بعد توليد الشاشة:

```
Flutter Build → Screenshot → Visual Analyzer → Compare against expected constraints → Detect Problems
```

ويتم فحص:
`Overflow`, `Clipping`, `Alignment`, `Spacing`, `Typography`, `Contrast`, `Image aspect ratio`, `Missing assets`, `RTL`, `Component consistency`, `Visual hierarchy`.

مثلاً:

```
Detected: Hero image cropped incorrectly
Repair:   Change image fit from cover → contain
```

أو:

```
Detected: CTA overlaps banner image
Repair:   Increase banner content region
```

## 19. LLM مسؤول عن ماذا؟

الـ LLM يجب أن يكون مسؤولاً عن القرارات الدلالية:

* What should be shown?
* Which component?
* Which visual style?
* Which asset type?
* What hierarchy?
* What state?
* What content?

ولا يكون مسؤولاً عن:

* Exact Flutter coordinates
* Raw widget trees
* Arbitrary colors
* Random padding
* Asset file management
* Compilation

## 20. Deterministic Compiler مسؤول عن ماذا؟

الـ compiler مسؤول عن:

```
Design Tokens
Component resolution
Asset resolution
Layout calculation
Flutter generation
Asset registration
Localization
RTL
Accessibility
Compilation
Validation
```

وهذا يحقق الهدف الأساسي للمشروع:
**Cheap LLM + Strong deterministic compiler = high-quality generated applications.**

## 21. أفضل Architecture

```
                 ┌──────────────────┐
                 │ Requirements     │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ LLM Reasoner    │
                 │ semantic only    │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ UI / Visual IR   │
                 └────────┬─────────┘
                          ↓
          ┌───────────────┼────────────────┐
          ↓               ↓                ↓
   Design System     Asset Planner    Layout Planner
          ↓               ↓                ↓
          └───────────────┼────────────────┘
                          ↓
                 ┌──────────────────┐
                 │ UI Compiler      │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Flutter App      │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Visual QA        │
                 └────────┬─────────┘
                          ↓
                   Repair / Accept
```

## الخلاصة

المولّد القوي لا يحتاج أن يجعل الـ LLM "مصمم UI" بالكامل.
الأفضل أن يبني Visual Compiler:

> LLM يفهم التصميم → IR يصفه → Asset Planner يوفر الصور والأيقونات → Design System يفرض الاتساق → Layout Engine يحدد الترتيب → Flutter Renderer ينفذ → Visual QA يتحقق.

وبهذا يمكن للمولّد إنتاج شاشات غنية مثل الأمثلة المرفقة، بما فيها الخلفيات، الـ banners، الصور، الأيقونات، البطاقات، الـ illustrations، الـ gradients، الـ promotional designs والـ state visuals، مع بقاء الناتج قابلاً لإعادة التوليد والتحقق بشكل deterministic.