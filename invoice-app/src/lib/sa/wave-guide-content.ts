import { ZATCA_WAVES } from '@zatca/shared'
import type { ZatcaWaveNumber } from '@zatca/shared'
import type { MarketingLang } from '#/lib/marketing/lang'
import type { GuideBlock } from '#/lib/ae/guide-content'
import { formatSaNumber } from './format'

/** Bump when the content changes; feeds Article JSON-LD dateModified. */
export const WAVE_GUIDE_DATE_PUBLISHED = '2026-11-08'
export const WAVE_GUIDE_DATE_MODIFIED = '2026-11-09'

export type WaveGuideSectionId =
  | 'timeline'
  | 'scope'
  | 'phase2'
  | 'qr'
  | 'deadline'
  | 'freelancers'
  | 'checklist'

export type WaveGuide = {
  /** <title> and meta description for /guides/zatca-wave-25. */
  seo: { title: string; description: string }
  title: string
  intro: string
  updatedLabel: string
  tocTitle: string
  verifyNote: string
  timeline: {
    caption: string
    headers: [string, string, string]
    rows: { wave: ZatcaWaveNumber; threshold: string; deadline: string }[]
  }
  sections: { id: WaveGuideSectionId; heading: string; blocks: GuideBlock[] }[]
  ctaTitle: string
  ctaBody: string
  ctaButton: string
  faqTitle: string
  faq: { question: string; answer: string }[]
}

const p = (text: string): GuideBlock => ({ type: 'p', text })
const ul = (...items: string[]): GuideBlock => ({ type: 'ul', items })

const rows = (lang: MarketingLang) =>
  ZATCA_WAVES.map((w) => ({
    wave: w.wave,
    threshold: formatSaNumber(w.thresholdSar, lang),
    deadline: w.deadline,
  }))

const guideEn: WaveGuide = {
  seo: {
    title: 'ZATCA Wave 25 Guide: Scope and 1 Feb 2027 Deadline | Qaftr',
    description:
      'ZATCA Phase 2 Wave 25 explained: the Wave 23–25 timeline, who is in scope, UBL 2.1, CSID, clearance vs reporting, freelancers and a checklist.',
  },
  title: 'ZATCA Wave 25: who is in scope, the 1 February 2027 deadline and what to do now',
  intro:
    'ZATCA is rolling out Phase 2 of e-invoicing in Saudi Arabia in waves, starting with the largest businesses and moving down. Wave 25 reaches much smaller businesses than any wave before it: VAT-registered taxpayers whose VAT-subject revenue was above SAR 187,500. If that describes you, your invoicing system will have to be integrated with ZATCA’s FATOORA platform by 1 February 2027. This guide explains the wave timeline, who is in scope, what Phase 2 requires technically, how the Phase 2 QR code differs from Phase 1, what happens if you miss the deadline, and what it means for freelancers. Dates and thresholds are as announced by ZATCA — verify with ZATCA before relying on them.',
  updatedLabel: 'Last updated',
  tocTitle: 'Contents',
  verifyNote:
    'Thresholds and dates are as publicly announced by ZATCA for Waves 23–25. ZATCA notifies each taxpayer directly; your notification is what counts — verify with ZATCA. Qaftr is independent and not affiliated with ZATCA. This is general guidance, not tax advice.',
  timeline: {
    caption: 'ZATCA Phase 2 waves 23–25 (as announced by ZATCA — verify with ZATCA)',
    headers: ['Wave', 'VAT-subject revenue above (SAR)', 'Integration deadline'],
    rows: rows('en'),
  },
  sections: [
    {
      id: 'timeline',
      heading: 'The wave timeline',
      blocks: [
        p('Phase 1 of e-invoicing, called Generation, started on 4 December 2021. Since then, VAT-registered businesses have had to issue invoices electronically through a compliant system, and simplified (B2C) tax invoices must carry a QR code. Phase 2, called Integration, started on 1 January 2023 for the largest taxpayers and has been extended to smaller businesses wave by wave, each wave defined by a revenue threshold and given its own integration window.'),
        p('The three most recent waves step the threshold down sharply. Wave 23 covers taxpayers with VAT-subject revenue above SAR 750,000, with a deadline of 31 March 2026. Wave 24 covers revenue above SAR 375,000, due by 30 June 2026. Wave 25 covers revenue above SAR 187,500, due by 1 February 2027. Each wave is assessed on revenue in the reference years ZATCA names in its announcement; our wave checker asks about 2022 to 2025 so you can see whether any year crosses a line.'),
        p('Because every wave so far has been announced months before its deadline, the waiting period is your preparation window. Businesses that leave integration to the last few weeks tend to discover that onboarding, testing and staff training take longer than expected.'),
      ],
    },
    {
      id: 'scope',
      heading: 'Who is in scope for Wave 25',
      blocks: [
        p('Wave 25 applies to resident taxpayers who are registered for VAT and whose VAT-subject revenue exceeded SAR 187,500 in a reference year. “Exceeded” matters: revenue of exactly SAR 187,500 is not above the threshold. If your revenue was higher than the Wave 24 or Wave 23 thresholds, you would normally have been selected in one of those earlier waves instead.'),
        p('SAR 187,500 is also the threshold for voluntary VAT registration, while registration becomes mandatory above SAR 375,000. In practice this means Wave 25 reaches almost every business that is registered for VAT and actively trading, including many owner-managed companies, shops and service providers that were never touched by earlier waves.'),
        ul(
          'In scope: VAT-registered businesses with VAT-subject revenue above SAR 187,500 in a reference year, unless already selected in an earlier wave.',
          'Not in scope of this wave: businesses that are not registered for VAT, and registered businesses whose revenue stayed at or below SAR 187,500.',
          'Notification: ZATCA informs selected taxpayers by email and SMS. Not receiving a message is not an exemption — if your revenue is above the threshold, verify with ZATCA.',
        ),
      ],
    },
    {
      id: 'phase2',
      heading: 'What Phase 2 requires',
      blocks: [
        p('Phase 2 changes an invoice from a document you generate into a data exchange with ZATCA. Your invoicing software, called an e-invoice generation solution (EGS), must produce each invoice as structured XML, sign it, and send it to the FATOORA platform in the way the invoice type requires.'),
        ul(
          'UBL 2.1 XML: every tax invoice, credit note and debit note is produced in the UBL 2.1 XML format following ZATCA’s data dictionary. A PDF can still be shared with the customer, but the XML is the legal record.',
          'Cryptographic stamp: each invoice is signed with a cryptographic stamp so that any change after issue can be detected. Invoices are also chained with the hash of the previous invoice and carry a unique identifier and counter.',
          'CSID: each EGS unit is onboarded on the FATOORA portal and receives a cryptographic stamp identifier (CSID), the certificate used to sign invoices. Onboarding uses a one-time password generated in the portal.',
          'Reporting simplified invoices: simplified (B2C) tax invoices are issued to the customer immediately and reported to ZATCA within 24 hours.',
          'Clearance of standard invoices: standard (B2B) tax invoices must be sent to ZATCA for clearance first; only the cleared invoice is shared with the buyer.',
        ),
        p('Most small businesses meet these requirements by choosing an e-invoicing solution provider that supports Phase 2 rather than building an integration themselves. When comparing providers, ask whether they handle onboarding, how they behave when FATOORA is unreachable, and how they archive your XML invoices.'),
      ],
    },
    {
      id: 'qr',
      heading: 'Phase 1 QR vs Phase 2 QR',
      blocks: [
        p('In Phase 1 the QR code on a simplified tax invoice encodes five fields in TLV format: seller name, VAT registration number, invoice timestamp, invoice total including VAT, and the VAT amount. Anyone can scan it with ZATCA’s app to read those values.'),
        p('In Phase 2 the QR code carries additional cryptographic data: the hash of the invoice XML, the digital signature, the public key and, for simplified invoices, the signature of ZATCA’s certificate. This lets a scanner check that the invoice was issued by an onboarded solution and has not been altered. A Phase 1 QR generator, including the free one in Qaftr, cannot produce a Phase 2 QR, because the extra fields only exist once your solution is onboarded and signing invoices.'),
      ],
    },
    {
      id: 'deadline',
      heading: 'What happens if you miss the deadline',
      blocks: [
        p('After your integration deadline, invoices that are not issued and reported or cleared through an integrated solution do not meet the e-invoicing requirements. ZATCA’s e-invoicing regulations include a table of violations — such as not issuing e-invoices, not sharing them with ZATCA, or tampering with the solution — with fines that can increase for repeated violations. Penalty amounts and procedures change over time, so check ZATCA’s current published schedule rather than relying on figures quoted online.'),
        p('Beyond fines, missing the deadline can cause practical problems: B2B customers may refuse invoices that were not cleared, and switching systems in a hurry raises the risk of errors in your records. If your deadline has already passed, contact a solution provider straight away and check your position with ZATCA.'),
      ],
    },
    {
      id: 'freelancers',
      heading: 'What Wave 25 means for freelancers',
      blocks: [
        p('Many freelancers in Saudi Arabia work under a freelance document and are not registered for VAT because their revenue is below the mandatory threshold of SAR 375,000. If you are not registered, Phase 2 integration does not apply to you, although you may still want clean, consistent invoices for your clients.'),
        p('If you registered for VAT voluntarily, or your revenue grew past the mandatory threshold, check your revenue carefully: crossing SAR 187,500 in a reference year likely brings you into Wave 25. In that case you will need a Phase 2 solution before 1 February 2027, even if you only send a handful of invoices a month. Lightweight cloud solutions designed for small businesses are usually the simplest route.'),
      ],
    },
    {
      id: 'checklist',
      heading: 'Wave 25 checklist',
      blocks: [
        ul(
          'Confirm your VAT registration status and your VAT-subject revenue for each reference year.',
          'Check your email and SMS for a ZATCA notification — and verify with ZATCA if your revenue is above SAR 187,500 but you heard nothing.',
          'Choose a Phase 2 e-invoicing solution provider and confirm it supports both clearance and reporting.',
          'Onboard each EGS unit on the FATOORA portal and obtain its CSID.',
          'Test in the simulation environment with real-looking simplified and standard invoices, credit notes and debit notes.',
          'Update invoice templates, customer master data (especially buyer VAT numbers for B2B) and internal approval steps.',
          'Train the people who issue invoices and agree what to do if the system or FATOORA is unavailable.',
          'Go live before 1 February 2027 and keep your XML invoices archived.',
        ),
      ],
    },
  ],
  ctaTitle: 'Not sure which wave you are in?',
  ctaBody: 'Answer three questions to estimate your wave, your deadline and the days you have left.',
  ctaButton: 'Check my wave',
  faqTitle: 'Wave 25 FAQ',
  faq: [
    {
      question: 'What is ZATCA Wave 25?',
      answer:
        'Wave 25 is the group of VAT-registered taxpayers that ZATCA selected for Phase 2 (Integration) based on VAT-subject revenue above SAR 187,500 in a reference year. As announced, the integration deadline is 1 February 2027 — verify with ZATCA.',
    },
    {
      question: 'How do I know if I am in Wave 25?',
      answer:
        'Check whether you are VAT-registered and whether your VAT-subject revenue was above SAR 187,500 in a reference year, and look for ZATCA’s email or SMS notification. Our free wave checker gives an estimate in a minute.',
    },
    {
      question: 'I did not receive a notification. Am I exempt?',
      answer:
        'No. ZATCA notifies taxpayers by email and SMS, but not receiving a message is not an exemption. If your revenue is above the threshold, verify with ZATCA directly.',
    },
    {
      question: 'Can I keep using PDF invoices?',
      answer:
        'You can still send a PDF or printed copy to your customer, but after your deadline the legal invoice must be the UBL 2.1 XML produced by an integrated solution, reported or cleared through FATOORA.',
    },
    {
      question: 'What is a CSID?',
      answer:
        'A cryptographic stamp identifier: the certificate each e-invoice generation solution unit receives when it is onboarded on the FATOORA portal, used to sign every invoice.',
    },
    {
      question: 'What is the difference between clearance and reporting?',
      answer:
        'Standard (B2B) tax invoices are cleared: ZATCA validates them before they go to the buyer. Simplified (B2C) invoices are reported: you give them to the customer immediately and send them to ZATCA within 24 hours.',
    },
    {
      question: 'Does Qaftr support Phase 2?',
      answer:
        'Not yet. Qaftr issues Phase 1 (Generation) invoices with the QR code. If you are in a Phase 2 wave you need a solution integrated with FATOORA before your deadline.',
    },
  ],
}

const guideAr: WaveGuide = {
  seo: {
    title: 'الموجة ٢٥ من زاتكا: من يشملها وموعد ١ فبراير ٢٠٢٧ | قافتر',
    description:
      'دليل الموجة ٢٥ من مرحلة الربط والتكامل: جدول الموجات ٢٣–٢٥، ومن يشمله الإلزام، وUBL 2.1 وCSID، والاعتماد والإبلاغ، والمستقلون، وقائمة تحقق.',
  },
  title: 'الموجة ٢٥ من زاتكا: من يشملها، وموعد ١ فبراير ٢٠٢٧، وماذا تفعل الآن',
  intro:
    'تطبّق زاتكا المرحلة الثانية من الفوترة الإلكترونية في السعودية على موجات، بدأت بالمنشآت الأكبر وتنزل تدريجياً. والموجة ٢٥ تصل إلى منشآت أصغر بكثير من أي موجة قبلها: المكلفون المسجّلون في ضريبة القيمة المضافة الذين تجاوزت إيراداتهم الخاضعة للضريبة ١٨٧٬٥٠٠ ريال. إذا كان هذا وضعك، فيجب أن يكون نظام الفوترة لديك مربوطاً بمنصة فاتورة التابعة لزاتكا قبل ١ فبراير ٢٠٢٧. يشرح هذا الدليل الجدول الزمني للموجات، ومن يشمله الإلزام، والمتطلبات التقنية للمرحلة الثانية، والفرق بين رمز QR في المرحلتين، وما يحدث إذا فاتك الموعد، وماذا يعني ذلك لأصحاب العمل الحر. الحدود والمواعيد حسب ما أعلنته زاتكا — تحقّق منها لدى زاتكا قبل الاعتماد عليها.',
  updatedLabel: 'آخر تحديث',
  tocTitle: 'المحتويات',
  verifyNote:
    'الحدود والمواعيد حسب ما أعلنته زاتكا للموجات ٢٣–٢٥. تُبلغ زاتكا كل مكلف مباشرة، وإشعارك هو المرجع، فتحقّق منه لدى زاتكا. قافتر منتج مستقل وغير تابع لزاتكا، والمعلومات إرشادية عامة وليست استشارة ضريبية.',
  timeline: {
    caption: 'موجات المرحلة الثانية ٢٣–٢٥ (حسب إعلان زاتكا — تحقّق من زاتكا)',
    headers: ['الموجة', 'الإيرادات الخاضعة للضريبة أعلى من (ريال)', 'موعد الربط'],
    rows: rows('ar'),
  },
  sections: [
    {
      id: 'timeline',
      heading: 'الجدول الزمني للموجات',
      blocks: [
        p('بدأت المرحلة الأولى من الفوترة الإلكترونية، وتسمى مرحلة الإصدار والحفظ، في ٤ ديسمبر ٢٠٢١. ومنذ ذلك الوقت يجب على المنشآت المسجّلة في ضريبة القيمة المضافة إصدار فواتيرها إلكترونياً عبر نظام متوافق، ويجب أن تحمل الفاتورة الضريبية المبسطة (للأفراد) رمز QR. أما المرحلة الثانية، وتسمى مرحلة الربط والتكامل، فبدأت في ١ يناير ٢٠٢٣ مع كبار المكلفين، ثم امتدت إلى المنشآت الأصغر موجة بعد موجة، ولكل موجة حد إيرادات وفترة ربط خاصة بها.'),
        p('آخر ثلاث موجات خفّضت الحد بشكل كبير. الموجة ٢٣ تشمل من تجاوزت إيراداتهم الخاضعة للضريبة ٧٥٠٬٠٠٠ ريال، وموعدها ٣١ مارس ٢٠٢٦. الموجة ٢٤ تشمل من تجاوزت إيراداتهم ٣٧٥٬٠٠٠ ريال، وموعدها ٣٠ يونيو ٢٠٢٦. والموجة ٢٥ تشمل من تجاوزت إيراداتهم ١٨٧٬٥٠٠ ريال، وموعدها ١ فبراير ٢٠٢٧. ويُقاس الاستحقاق على إيرادات السنوات المرجعية التي تحددها زاتكا في إعلانها، وأداة التحقق لدينا تسألك عن السنوات من ٢٠٢٢ إلى ٢٠٢٥ لترى إن كانت أي سنة تتجاوز الحد.'),
        p('بما أن كل موجة حتى الآن أُعلنت قبل موعدها بعدة أشهر، فهذه الفترة هي فرصتك للاستعداد. المنشآت التي تؤجل الربط إلى الأسابيع الأخيرة تكتشف عادة أن التسجيل والاختبار وتدريب الموظفين يأخذ وقتاً أطول مما توقعت.'),
      ],
    },
    {
      id: 'scope',
      heading: 'من تشمله الموجة ٢٥',
      blocks: [
        p('تنطبق الموجة ٢٥ على المكلفين المقيمين المسجّلين في ضريبة القيمة المضافة الذين تجاوزت إيراداتهم الخاضعة للضريبة ١٨٧٬٥٠٠ ريال في سنة مرجعية. وكلمة «تجاوزت» مهمة: الإيرادات التي تساوي ١٨٧٬٥٠٠ ريال بالضبط ليست فوق الحد. وإذا كانت إيراداتك أعلى من حد الموجة ٢٤ أو ٢٣، فالمعتاد أن تكون قد اختِرت في إحدى تلك الموجات السابقة.'),
        p('مبلغ ١٨٧٬٥٠٠ ريال هو أيضاً حد التسجيل الاختياري في ضريبة القيمة المضافة، بينما يصبح التسجيل إلزامياً عند تجاوز ٣٧٥٬٠٠٠ ريال. عملياً يعني هذا أن الموجة ٢٥ تصل إلى أغلب المنشآت المسجّلة في الضريبة والتي تمارس نشاطها فعلياً، ومنها كثير من الشركات الصغيرة التي يديرها ملّاكها، والمحلات، ومقدّمو الخدمات الذين لم تشملهم الموجات السابقة.'),
        ul(
          'ضمن النطاق: المنشآت المسجّلة في ضريبة القيمة المضافة التي تجاوزت إيراداتها الخاضعة للضريبة ١٨٧٬٥٠٠ ريال في سنة مرجعية، ما لم تكن اختيرت في موجة سابقة.',
          'خارج نطاق هذه الموجة: المنشآت غير المسجّلة في ضريبة القيمة المضافة، والمنشآت المسجّلة التي بقيت إيراداتها عند ١٨٧٬٥٠٠ ريال أو أقل.',
          'الإشعار: تبلغ زاتكا المنشآت المختارة عبر البريد الإلكتروني والرسائل النصية. عدم وصول رسالة لا يعني الإعفاء — إذا كانت إيراداتك فوق الحد فتحقّق من زاتكا.',
        ),
      ],
    },
    {
      id: 'phase2',
      heading: 'متطلبات المرحلة الثانية',
      blocks: [
        p('المرحلة الثانية تحوّل الفاتورة من مستند تنشئه إلى عملية تبادل بيانات مع زاتكا. يجب أن يقوم برنامج الفوترة لديك، ويسمى حل إصدار الفواتير الإلكترونية (EGS)، بإنشاء كل فاتورة بصيغة XML منظمة، وتوقيعها، وإرسالها إلى منصة فاتورة بالطريقة التي يتطلبها نوع الفاتورة.'),
        ul(
          'صيغة UBL 2.1 XML: تُنشأ كل فاتورة ضريبية وإشعار دائن وإشعار مدين بصيغة UBL 2.1 XML وفق قاموس البيانات الخاص بزاتكا. يمكنك مشاركة نسخة PDF مع العميل، لكن ملف XML هو السجل النظامي.',
          'الختم التشفيري: توقَّع كل فاتورة بختم تشفيري بحيث يمكن اكتشاف أي تعديل بعد إصدارها. وترتبط الفواتير ببعضها عبر بصمة الفاتورة السابقة، وتحمل كل فاتورة معرّفاً فريداً وعدّاداً.',
          'شهادة CSID: تُسجَّل كل وحدة من وحدات الحل في بوابة فاتورة وتحصل على معرّف الختم التشفيري (CSID)، وهو الشهادة المستخدمة لتوقيع الفواتير. ويتم التسجيل باستخدام رمز تحقق لمرة واحدة يُنشأ من البوابة.',
          'إبلاغ الفواتير المبسطة: تُسلَّم الفاتورة الضريبية المبسطة (للأفراد) للعميل فوراً، وتُبلَّغ بها زاتكا خلال ٢٤ ساعة.',
          'اعتماد الفواتير القياسية: تُرسَل الفاتورة الضريبية القياسية (بين المنشآت) إلى زاتكا لاعتمادها (Clearance) أولاً، ولا تُشارك مع المشتري إلا بعد اعتمادها.',
        ),
        p('تستوفي أغلب المنشآت الصغيرة هذه المتطلبات باختيار مزوّد حلول فوترة إلكترونية يدعم المرحلة الثانية بدلاً من بناء الربط بنفسها. عند المقارنة بين المزوّدين، اسأل هل يتولّون عملية التسجيل، وكيف يتصرف النظام إذا تعذّر الوصول لمنصة فاتورة، وكيف يحفظون ملفات XML لفواتيرك.'),
      ],
    },
    {
      id: 'qr',
      heading: 'رمز QR في المرحلة الأولى والثانية',
      blocks: [
        p('في المرحلة الأولى يحمل رمز QR على الفاتورة الضريبية المبسطة خمسة حقول بصيغة TLV: اسم البائع، والرقم الضريبي، ووقت إصدار الفاتورة، وإجمالي الفاتورة شامل الضريبة، ومبلغ الضريبة. ويمكن لأي شخص مسحه بتطبيق زاتكا لقراءة هذه القيم.'),
        p('أما في المرحلة الثانية فيحمل رمز QR بيانات تشفيرية إضافية: بصمة ملف XML للفاتورة، والتوقيع الرقمي، والمفتاح العام، ولشهادة زاتكا توقيعها في الفواتير المبسطة. وهذا يسمح بالتحقق من أن الفاتورة صادرة من حل مسجّل ولم تُعدَّل. ولا يستطيع مولّد رموز المرحلة الأولى، ومنه المولّد المجاني في قافتر، إنشاء رمز المرحلة الثانية، لأن الحقول الإضافية لا توجد إلا بعد تسجيل الحل وبدء توقيع الفواتير.'),
      ],
    },
    {
      id: 'deadline',
      heading: 'ماذا يحدث إذا فاتك الموعد',
      blocks: [
        p('بعد موعد الربط الخاص بك، الفواتير التي لا تصدر وتُبلَّغ أو تُعتمد عبر حل مربوط لا تستوفي متطلبات الفوترة الإلكترونية. وتتضمن لوائح الفوترة الإلكترونية لدى زاتكا جدولاً للمخالفات، مثل عدم إصدار الفواتير إلكترونياً أو عدم مشاركتها مع زاتكا أو التلاعب بالحل، مع غرامات قد تزيد عند تكرار المخالفة. مبالغ الغرامات وإجراءاتها تتغير مع الوقت، لذلك راجع الجدول المنشور حالياً لدى زاتكا بدلاً من الاعتماد على أرقام متداولة على الإنترنت.'),
        p('وإضافة إلى الغرامات، قد يسبب فوات الموعد مشكلات عملية: قد يرفض العملاء من المنشآت الفواتير غير المعتمدة، وتغيير النظام على عجل يرفع احتمال الأخطاء في سجلاتك. وإذا كان موعدك قد فات بالفعل، فتواصل مع مزوّد حلول فوراً وراجع وضعك مع زاتكا.'),
      ],
    },
    {
      id: 'freelancers',
      heading: 'ماذا تعني الموجة ٢٥ للمستقلين',
      blocks: [
        p('كثير من المستقلين في السعودية يعملون بوثيقة العمل الحر وغير مسجّلين في ضريبة القيمة المضافة لأن إيراداتهم أقل من حد التسجيل الإلزامي البالغ ٣٧٥٬٠٠٠ ريال. إذا لم تكن مسجّلاً، فإن الربط في المرحلة الثانية لا ينطبق عليك، مع أنك قد ترغب في فواتير مرتبة ومتسقة لعملائك.'),
        p('أما إذا سجّلت في الضريبة اختيارياً، أو نمت إيراداتك فوق الحد الإلزامي، فراجع إيراداتك بعناية: تجاوز ١٨٧٬٥٠٠ ريال في سنة مرجعية يدخلك غالباً ضمن الموجة ٢٥. وفي هذه الحالة ستحتاج حلاً للمرحلة الثانية قبل ١ فبراير ٢٠٢٧، حتى لو كنت تصدر عدداً قليلاً من الفواتير شهرياً. والحلول السحابية الخفيفة المصممة للمنشآت الصغيرة هي عادة الطريق الأسهل.'),
      ],
    },
    {
      id: 'checklist',
      heading: 'قائمة التحقق للموجة ٢٥',
      blocks: [
        ul(
          'تأكد من حالة تسجيلك في ضريبة القيمة المضافة ومن إيراداتك الخاضعة للضريبة في كل سنة مرجعية.',
          'راجع بريدك الإلكتروني ورسائلك النصية بحثاً عن إشعار من زاتكا — وتحقّق من زاتكا إذا كانت إيراداتك فوق ١٨٧٬٥٠٠ ريال ولم يصلك شيء.',
          'اختر مزوّد حلول فوترة إلكترونية للمرحلة الثانية وتأكد أنه يدعم الاعتماد والإبلاغ معاً.',
          'سجّل كل وحدة من وحدات الحل في بوابة فاتورة واحصل على شهادة CSID الخاصة بها.',
          'اختبر في بيئة المحاكاة بفواتير مبسطة وقياسية وإشعارات دائنة ومدينة قريبة من الواقع.',
          'حدّث قوالب الفواتير وبيانات العملاء، وخاصة الأرقام الضريبية للمشترين من المنشآت، وخطوات الموافقة الداخلية.',
          'درّب الموظفين الذين يصدرون الفواتير، واتفقوا على ما يجب فعله إذا تعطل النظام أو منصة فاتورة.',
          'انتقل للتشغيل الفعلي قبل ١ فبراير ٢٠٢٧ واحتفظ بملفات XML لفواتيرك.',
        ),
      ],
    },
  ],
  ctaTitle: 'لست متأكداً من موجتك؟',
  ctaBody: 'أجب عن ثلاثة أسئلة لنقدّر موجتك وموعد ربطك والأيام المتبقية.',
  ctaButton: 'اعرف موجتك',
  faqTitle: 'أسئلة شائعة عن الموجة ٢٥',
  faq: [
    {
      question: 'ما هي الموجة ٢٥ من زاتكا؟',
      answer:
        'الموجة ٢٥ هي مجموعة المكلفين المسجّلين في ضريبة القيمة المضافة الذين اختارتهم زاتكا للمرحلة الثانية (مرحلة الربط والتكامل) لأن إيراداتهم الخاضعة للضريبة تجاوزت ١٨٧٬٥٠٠ ريال في سنة مرجعية. وموعد الربط المعلن هو ١ فبراير ٢٠٢٧ — تحقّق من زاتكا.',
    },
    {
      question: 'كيف أعرف إن كنت ضمن الموجة ٢٥؟',
      answer:
        'تأكد أنك مسجّل في ضريبة القيمة المضافة وأن إيراداتك الخاضعة للضريبة تجاوزت ١٨٧٬٥٠٠ ريال في سنة مرجعية، وابحث عن إشعار زاتكا بالبريد الإلكتروني أو الرسائل النصية. وأداة التحقق المجانية لدينا تعطيك تقديراً خلال دقيقة.',
    },
    {
      question: 'لم يصلني إشعار، هل أنا معفى؟',
      answer:
        'لا. تبلغ زاتكا المكلفين بالبريد الإلكتروني والرسائل النصية، لكن عدم وصول رسالة لا يعني الإعفاء. إذا كانت إيراداتك فوق الحد فتحقّق من زاتكا مباشرة.',
    },
    {
      question: 'هل أستطيع الاستمرار في فواتير PDF؟',
      answer:
        'يمكنك إرسال نسخة PDF أو مطبوعة لعميلك، لكن بعد موعدك تكون الفاتورة النظامية هي ملف UBL 2.1 XML الصادر من حل مربوط، والمبلَّغ أو المعتمد عبر منصة فاتورة.',
    },
    {
      question: 'ما هي شهادة CSID؟',
      answer:
        'معرّف الختم التشفيري: الشهادة التي تحصل عليها كل وحدة من وحدات حل الفوترة الإلكترونية عند تسجيلها في بوابة فاتورة، وتُستخدم لتوقيع كل فاتورة.',
    },
    {
      question: 'ما الفرق بين الاعتماد والإبلاغ؟',
      answer:
        'الفواتير الضريبية القياسية (بين المنشآت) تُعتمد: تتحقق منها زاتكا قبل وصولها للمشتري. والفواتير المبسطة (للأفراد) تُبلَّغ: تسلّمها للعميل فوراً وترسلها لزاتكا خلال ٢٤ ساعة.',
    },
    {
      question: 'هل يدعم قافتر المرحلة الثانية؟',
      answer:
        'ليس بعد. يُصدر قافتر فواتير وفق المرحلة الأولى (مرحلة الإصدار والحفظ) مع رمز QR. إذا كانت منشأتك ضمن موجة في المرحلة الثانية فستحتاج حلاً مربوطاً بمنصة فاتورة قبل موعدك.',
    },
  ],
}

export function getWaveGuide(lang: MarketingLang): WaveGuide {
  return lang === 'en' ? guideEn : guideAr
}

export function waveGuideWordCount(guide: WaveGuide): number {
  const parts = [
    guide.title,
    guide.intro,
    ...guide.sections.flatMap((s) => [
      s.heading,
      ...s.blocks.flatMap((b) => (b.type === 'p' ? [b.text] : b.items)),
    ]),
    ...guide.faq.flatMap((f) => [f.question, f.answer]),
  ]
  return parts.join(' ').split(/\s+/).filter(Boolean).length
}
