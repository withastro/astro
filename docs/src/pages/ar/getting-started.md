---
layout: ~/layouts/MainLayout.astro
title: باشر بالبدأ
lang: ar
dir: rtl
---

Astro هو باني موقع ثابت. تعرف أكثر حول ماهية Astro من خلال [صفحتنا الرئيسية](https://astro.build/) أو نشرة [الإصدارات](https://astro.build/blog/introducing-astro). تُعد هذه الصفحة نُبذة موجزة للتوثيق الخاص بـAstro وأيضًا لكل المصادر التي تتعلق به.

إن كنت تتطلع عن ملخص سريع حول ما هو Astro بشكلٍ عام؟ [تفقد صفحتنا الرئيسية.](https://astro.build/blog/introducing-astro)

## جرب Astro

أبسط طريقة لتجرب Astro هي بتنفيذ أمر `npm init astro` في داخل مُجلد جديد على جهازك، وسيقوم Astro CLI بمُساعدتك على بدأ مشروع Astro جديد.

لتباشر البدأ باستخدام Astro من خلال 5 خطوات سريعة وبسيطة، تفقد [دليل البدأ-بسرعة](quick-start).

أو إقرأ [دليل التثبيت](/installation) إن كنت تريد الغوص في عملية تهيئة Astro.

### أمثلة على بعض المشاريع

أن كنت تفضل التعلم عن طريق الأمثلة، ألقي نظرةٍ على [مكتبة الأمثلة الشاملة](https://github.com/withastro/astro/tree/main/examples) المتواجدة على Github.

بمقدورك الإطلاع على أي من هذه الأمثلة وتجربتها مُباشرةً على جهازك،
فقط نفذ الأمر <code ltr="left">npm init astro</code> متبوعًا بـ
`--template`. الإشارة `--template` أيضًا تدعم الامثلة الخارجية التي يصنعها المجتمع

```bash
# أمر تهيئة أحد القوالب الرسمية التي يوفرها استرو
npm init astro -- --template [OFFICIAL_EXAMPLE_NAME]
# أمر تهيئة القوالب الخارجية التي يوفرها المُجتمع
npm init astro -- --template [GITHUB_USER]/[REPO_NAME]
npm init astro -- --template [GITHUB_USER]/[REPO_NAME]/path/to/example
```

### جربه على المُتصفح

إن كنت مهتمًا وتريد اللعب وتجربة Astro على المتصفح، بمقدورك استخدام online code playground، جرب قالب مشروعنا "Hello World" على [CodeSandbox](https://codesandbox.io/s/astro-template-hugb3).

_ملحوظة: بعض المُميزات مُقتصرة على CodeSandbx (مثلاً: التحديث السريع "Fast Refresh") حاليًا._

## تعلمُ Astro

يأتي العديد الأشخاص من خلفياتِ تعلم مُختلفة إلى Astro، أيًا كانت طريقة التعليم التي تفضلها سواءً أكنت تفضل الطريقة النظرية أو الطريقة العملية، نتمنى أن تجد هذا القسم مفيدًا.

- إن كُنت تُفضل **التعلم من خلال التجربة العملية**، أبدأ من خلال [مكتبتنا للأمثلة](https://github.com/withastro/astro/tree/main/examples).
- إن كُنت تُفضل **التعلم من خلال الفهم خطوةً بخطوة**، أبدأ من خلال [دليل المفاهيم الأساسية والإرشادات](/core-concepts/project-structure).

مثل أي تقنيةٍ ليست بمألوفة، Astro يأتيك بمنحنى تعليمي مختلف بعض الشيء، ولكن على أي حال، مع بعض الصبر والممارسة، نحن متأكدون بأنك _ستتأقلم معه_ في وقتٍ هين دون أن تشعر.

### تعلمُ تركيب <code dir="ltr">.astro</code> النحوي (syntax)

مع بدأ تعلمك لـAstro ستلاحظ العديد من الملفات التي تنتهي بصيغة <code dir="ltr">.astro</code> هي ملفات مكتوبة بـ Astro’s Component Syntax والتي تعد: طريقة كتابة مشابهة جدًا لملفات HTML يستخدمها Astro في القوالب.
صممت هذه الصيغة لتكون قريبة ومشابهة للـ HTML و JSX، إن كنت تعرف أحدهما فستتأقلم مع <code dir="ltr">.astro</code> بسهولة.

تفقد دليلنا المساعد [مكونات Astro](/core-concepts/astro-components) سيكون مدخل يساعدك على تعلم Astro syntax، ويعد أفضل طريقة للتعلم.

### مرجع للـAPI

يُفيدك هذا الجزء من التوثيق حينما تريد الإطلاع أكثر بشأن تفاصيل Astro API. على سبيل المثال، يتضمن [مرجع الإعداد](/reference/configuration-reference) قائمة لكل الإعدادات الممكنة المتاحة لكي تستخدمها. [المكونات المصممة مسبقًا](/reference/builtin-components) تتضمن قائمة بكل العناصر الرئيسية مثل <span dir="ltr">`<Markdown />` و `<Code />`</span>.

### إصدارات التوثيق

هذا التوثيق يُسلط الضوء دومًا على أخر إصدار مستقر من Astro، وريثما نصل إلى إصدار 1.0 الرئيسي سنقوم بإضافة القابلية لتصفح اللإصدارات المختلفة من التوثيق.

## أبقى مُطلعًا

حساب [@astrodotbuild](https://twitter.com/astrodotbuild) على تويتر هو المصدر الرسمي لأخر المُستجدات من فريق Astro.

ونحن أيضًا نُعد نشرة إصدارات ونعلن عنها في [مُجتمعنا على ديسكورد](https://astro.build/chat) على قناة <span dir="ltr">#announcements</span>

ليست كل إصدارات Astro تملك تدوينة نشرةٍ خاصة بها، لكن ستجد سجلًا للتغيرات في ملف [`CHANGELOG.md` في مستودع Astro](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md).

## شيءٌ ما ناقص؟

إن كان هناك شيءُ ما غير مُوثق أو لو كنت تشعر بالحيرة والإرتباك من جزءٍ معين في التوثيق، لا تتردد في [رفع طلب خطبٌ ما في ملف التوثيق](https://github.com/withastro/astro/issues/new/choose)، مع اقتراحك للتحسين، أو قم بتغريد تغريدةٍ إلى حسابنا على تويتر [@astrodotbuild](https://twitter.com/astrodotbuild)، نحب سماع آرائك!

## التَقدِير

دليل باشر بالبدأ معتمدٌ على دليل البدأ الخاص بـ[React](https://ar.reactjs.org/).
