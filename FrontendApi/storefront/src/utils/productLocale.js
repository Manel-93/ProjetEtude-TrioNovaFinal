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
  if (n.includes('tensiometre') && !n.includes('bras')) return 'Electronic blood pressure monitor';
  if (n.includes('stethoscope')) return 'Professional stethoscope';
  if (n.includes('echographe') && n.includes('portable')) return 'Premium portable ultrasound system';
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
  return fallback;
}

function pickAr(n, fallback) {
  if (n.includes('thermometre') && n.includes('infrarouge')) return 'مقياس حرارة بالأشعة تحت الحمراء';
  if (n.includes('tensiometre') && !n.includes('bras')) return 'جهاز قياس ضغط الدم الإلكتروني';
  if (n.includes('stethoscope')) return 'سماعة طبية احترافية';
  if (n.includes('echographe') && n.includes('portable')) return 'جهاز موجات فوق صوتية محمول';
  if (n.includes('negatoscope') && n.includes('led')) return 'عارض أشعة سينية LED';
  if (n.includes('lit') && n.includes('medicalise')) return 'سرير طبي كهربائي';
  if (n.includes('gants') && n.includes('nitrile')) return 'قفازات نتريل غير ممسحة';
  if (n.includes('masques') && n.includes('chirurgic')) return 'كمامات جراحية';
  if (n.includes('otoscope') && n.includes('fibre')) return 'منظار أذن LED بالألياف البصرية';
  if (n.includes('glucometre')) return 'جهاز قياس سكر الدم';
  if (n.includes('marteau') && n.includes('reflexe')) return 'مطرقة انعكاس';
  if (n.includes('autoclave') && n.includes('classe') && n.includes('b')) return 'معقم بخار فئة B';
  if (n.includes('seringue') && n.includes('corps')) return 'محاقن ثلاثية القطع 5 مل';
  if ((n.includes('gueridon') || n.includes('guerido')) && n.includes('inox')) return 'عربة طبية من الفولاذ المقاوم للصدأ';
  if (n.includes('table') && n.includes('examen')) return 'طاولة فحص كهربائية';
  if (n.includes('capteur') && n.includes('plan') && n.includes('radiolog')) return 'مستشعر مسطح للأشعة';
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
