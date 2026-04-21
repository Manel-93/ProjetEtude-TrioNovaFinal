/**
 * Libellés vitrine : la base ne stocke qu’un nom (souvent en français).
 * Si nameEn / nameAr sont renseignés par l’API, ils priment ; sinon on déduit EN/AR par motifs.
 */

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function pickEn(n, fallback) {
  if ((n.includes('equipement') || n.includes('equipements')) && n.includes('medic')) {
    return 'Medical equipment';
  }
  if (n.includes('seringue') && n.includes('corps') && (n.includes('5ml') || n.includes('5 ml'))) {
    return '3-part 5 ml syringes';
  }
  if ((n.includes('gueridon') || n.includes('guerido')) && n.includes('inox')) {
    return 'Stainless steel medical trolley';
  }
  if (n.includes('table') && n.includes('examen') && (n.includes('electrique') || n.includes('electronique'))) {
    return 'Electric examination table';
  }
  if (n.includes('capteur') && n.includes('plan') && n.includes('radiolog')) {
    return 'Radiology flat-panel detector';
  }
  if (n.includes('thermometre') && n.includes('infrarouge')) return 'Infrared thermometer';
  if (
    n.includes('tensiometre') &&
    (n.includes('bras') || n.includes('brassard')) &&
    (n.includes('electrique') || n.includes('electronique'))
  ) {
    return 'Upper-arm electronic blood pressure monitor';
  }
  if (n.includes('tensiometre') && !n.includes('bras') && !n.includes('brassard')) {
    return 'Electronic blood pressure monitor';
  }
  if (n.includes('stethoscope')) return 'Professional stethoscope';
  if (n.includes('echographe') && n.includes('portable')) return 'Premium portable ultrasound system';
  if (n.includes('echographe')) return 'Ultrasound imaging system';
  if (n.includes('negatoscope') && n.includes('led')) return 'LED X-ray film viewer';
  if (n.includes('lit') && n.includes('medicalise') && (n.includes('electrique') || n.includes('electronique'))) {
    return 'Electric medical bed';
  }
  if (n.includes('gants') && n.includes('nitrile')) return 'Powder-free nitrile gloves';
  if (n.includes('masques') && n.includes('chirurgic')) return 'Surgical face masks';
  if (n.includes('otoscope') && n.includes('fibre') && n.includes('optique')) {
    return 'LED fiber optic otoscope';
  }
  if (n.includes('glucometre')) return 'Blood glucose meter';
  if (n.includes('marteau') && n.includes('reflexe')) return 'Reflex hammer';
  if (n.includes('autoclave') && n.includes('classe') && n.includes('b')) return 'Class B autoclave 24 L';
  if (n.includes('chaise') && n.includes('roulante')) return 'Wheelchair';
  if (n.includes('deambulateur')) return 'Walking frame (rollator)';
  if (n.includes('defibrillateur')) return 'Automated external defibrillator (AED)';
  if (n.includes('concentrateur') && n.includes('oxygene')) return 'Oxygen concentrator';
  if (n.includes('oxymetre') || (n.includes('saturo') && n.includes('metre'))) return 'Pulse oximeter';
  if (n.includes('pompe') && n.includes('vide')) return 'Medical suction pump';
  if (n.includes('lampe') && (n.includes('scialytique') || n.includes('led'))) return 'Surgical examination lamp';
  if (n.includes('balance') && n.includes('precision')) return 'Precision medical scale';
  if (n.includes('scanner') || n.includes('tomographe')) return 'CT / imaging scanner';
  return fallback;
}

function pickAr(n, fallback) {
  if ((n.includes('equipement') || n.includes('equipements')) && n.includes('medic')) {
    return 'معدات طبية';
  }
  if (n.includes('seringue') && n.includes('corps') && (n.includes('5ml') || n.includes('5 ml'))) {
    return 'محاقن ثلاثية القطع 5 مل';
  }
  if ((n.includes('gueridon') || n.includes('guerido')) && n.includes('inox')) {
    return 'عربة طبية من الفولاذ المقاوم للصدأ';
  }
  if (n.includes('table') && n.includes('examen') && (n.includes('electrique') || n.includes('electronique'))) {
    return 'طاولة فحص كهربائية';
  }
  if (n.includes('capteur') && n.includes('plan') && n.includes('radiolog')) {
    return 'مستشعر مسطح للأشعة';
  }
  if (n.includes('thermometre') && n.includes('infrarouge')) return 'مقياس حرارة بالأشعة تحت الحمراء';
  if (
    n.includes('tensiometre') &&
    (n.includes('bras') || n.includes('brassard')) &&
    (n.includes('electrique') || n.includes('electronique'))
  ) {
    return 'جهاز قياس ضغط الدم الإلكتروني للذراع';
  }
  if (n.includes('tensiometre') && !n.includes('bras') && !n.includes('brassard')) {
    return 'جهاز قياس ضغط الدم الإلكتروني';
  }
  if (n.includes('stethoscope')) return 'سماعة طبية احترافية';
  if (n.includes('echographe') && n.includes('portable')) return 'جهاز موجات فوق صوتية محمول';
  if (n.includes('echographe')) return 'جهاز تصوير بالموجات فوق الصوتية';
  if (n.includes('negatoscope') && n.includes('led')) return 'عارض أشعة سينية LED';
  if (n.includes('lit') && n.includes('medicalise') && (n.includes('electrique') || n.includes('electronique'))) {
    return 'سرير طبي كهربائي';
  }
  if (n.includes('lit') && n.includes('medicalise')) return 'سرير طبي';
  if (n.includes('gants') && n.includes('nitrile')) return 'قفازات نتريل غير ممسحة';
  if (n.includes('masques') && n.includes('chirurgic')) return 'كمامات جراحية';
  if (n.includes('otoscope') && n.includes('fibre') && n.includes('optique')) {
    return 'منظار أذن LED بالألياف البصرية';
  }
  if (n.includes('otoscope') && n.includes('fibre')) return 'منظار أذن بالألياف البصرية';
  if (n.includes('glucometre')) return 'جهاز قياس سكر الدم';
  if (n.includes('marteau') && n.includes('reflexe')) return 'مطرقة انعكاس';
  if (n.includes('autoclave') && n.includes('classe') && n.includes('b')) return 'معقم بخار فئة B';
  if (n.includes('chaise') && n.includes('roulante')) return 'كرسي متحرك';
  if (n.includes('deambulateur')) return 'مشاية طبية (دعامة للمشي)';
  if (n.includes('defibrillateur')) return 'جهاز إزالة الرجفان (AED)';
  if (n.includes('concentrateur') && n.includes('oxygene')) return 'مكثّف أكسجين طبي';
  if (n.includes('oxymetre') || (n.includes('saturo') && n.includes('metre'))) return 'مقياس تشبّع الأكسجين بالدم';
  if (n.includes('pompe') && n.includes('vide')) return 'مضخة شفط طبية';
  if (n.includes('lampe') && (n.includes('scialytique') || n.includes('led'))) return 'مصباح فحص / جراحي LED';
  if (n.includes('balance') && n.includes('precision')) return 'ميزان طبي دقيق';
  if (n.includes('scanner') || n.includes('tomographe')) return 'ماسح التصوير المقطعي / التصوير';
  return fallback;
}

function pickDescEn(n, fallback) {
  if (n.includes('thermometre') && n.includes('infrarouge')) {
    return 'Fast, non-contact temperature checks for clinics and home care.';
  }
  if (n.includes('tensiometre') || n.includes('pression')) {
    return 'Reliable blood pressure monitoring with clear digital readings.';
  }
  if (n.includes('stethoscope')) return 'Clear auscultation for everyday clinical assessments.';
  if (n.includes('echographe')) return 'Portable ultrasound imaging for point-of-care diagnostics.';
  if (n.includes('oxymetre') || n.includes('saturo')) return 'Instant SpO2 and pulse readings at your fingertips.';
  if (n.includes('defibrillateur')) return 'Emergency-ready AED designed for fast intervention.';
  if (n.includes('concentrateur') && n.includes('oxygene')) return 'Continuous oxygen support with quiet operation.';
  return fallback;
}

function pickDescAr(n, fallback) {
  if (n.includes('thermometre') && n.includes('infrarouge')) {
    return 'قياس سريع للحرارة بدون تلامس للعيادات والرعاية المنزلية.';
  }
  if (n.includes('tensiometre') || n.includes('pression')) {
    return 'متابعة دقيقة لضغط الدم مع قراءة رقمية واضحة.';
  }
  if (n.includes('stethoscope')) return 'سماعة واضحة للفحوصات السريرية اليومية.';
  if (n.includes('echographe')) return 'تصوير موجات فوق صوتية محمول للتشخيص السريع.';
  if (n.includes('oxymetre') || n.includes('saturo')) return 'قياس فوري لتشبع الأكسجين والنبض.';
  if (n.includes('defibrillateur')) return 'جهاز AED للطوارئ للاستجابة السريعة.';
  if (n.includes('concentrateur') && n.includes('oxygene')) return 'دعم أكسجين مستمر مع تشغيل هادئ.';
  return fallback;
}

export function getProductDisplayName(product, lng) {
  if (!product?.name) return '';
  const l = String(lng || 'fr').split('-')[0];
  if (l === 'fr') return product.name;
  if (l === 'en' && product.nameEn) return product.nameEn;
  if (l === 'ar' && product.nameAr) return product.nameAr;
  const n = norm(product.name);
  if (l === 'en') return pickEn(n, product.name);
  if (l === 'ar') return pickAr(n, product.name);
  return product.name;
}

export function getProductDisplayDescription(product, lng) {
  const desc = product?.description;
  if (!desc) return '';
  const l = String(lng || 'fr').split('-')[0];
  if (l === 'fr') return desc;
  if (l === 'en' && product.descriptionEn) return product.descriptionEn;
  if (l === 'ar' && product.descriptionAr) return product.descriptionAr;
  const n = norm(`${product?.name || ''} ${product?.slug || ''} ${desc}`);
  if (l === 'en') return pickDescEn(n, desc);
  if (l === 'ar') return pickDescAr(n, desc);
  return desc;
}
