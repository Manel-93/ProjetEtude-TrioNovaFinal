import { getProductDisplayName } from './productLocale';

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function subtitleEn(n, raw) {
  if (n.includes('tous') && n.includes('equipement') && n.includes('medic') && n.includes('professionnel')) {
    return 'All professional medical equipment.';
  }
  if (n.includes('thermometre') && (n.includes('infrarouge') || n.includes('sans contact'))) {
    return 'Fast, non-contact readings for screening and daily checks.';
  }
  if (n.includes('tensiometre') || n.includes('tension') || n.includes('pression')) {
    return 'Automatic cuff inflation and clear digital display.';
  }
  if (n.includes('echographe') || n.includes('imagerie')) {
    return 'Portable imaging for bedside and point-of-care exams.';
  }
  if (n.includes('stethoscope')) {
    return 'Clear auscultation for routine clinical use.';
  }
  if (n.includes('equipement') && n.includes('professionnel')) {
    return 'Professional-grade equipment for healthcare teams.';
  }
  if (n.includes('equipement') && n.includes('medic')) {
    return 'Medical equipment for clinics, hospitals and daily care.';
  }
  if (n.includes('livraison') || n.includes('stock')) {
    return 'Quality medical supplies with reliable availability.';
  }
  return raw;
}

function subtitleAr(n, raw) {
  if (n.includes('thermometre') && (n.includes('infrarouge') || n.includes('sans contact'))) {
    return 'قياس سريع بدون تلامس للكشف والمتابعة اليومية.';
  }
  if (n.includes('tensiometre') || n.includes('tension')) {
    return 'نفخ تلقائي للكمّة وعرض رقمي واضح.';
  }
  if (n.includes('echographe') || n.includes('imagerie')) {
    return 'تصوير محمول بجانب المريض.';
  }
  if (n.includes('stethoscope')) {
    return 'سماعة واضحة للاستخدام السريري الروتيني.';
  }
  if (n.includes('equipement') && n.includes('professionnel')) {
    return 'معدات احترافية للفرق الصحية.';
  }
  if (n.includes('equipement') && n.includes('medic')) {
    return 'معدات طبية للعيادات والمستشفيات والرعاية اليومية.';
  }
  return raw;
}

/**
 * Diapositive admin (title / subtitle / slug).
 * @param {{ title?: string, subtitle?: string, slug?: string } | null} slide
 * @param {string} [lng]
 */
export function getCarouselSlideTitle(slide, lng) {
  if (!slide?.title) return '';
  return getProductDisplayName({ name: slide.title, slug: slide.slug }, lng);
}

export function getCarouselSlideSubtitle(slide, lng) {
  const sub = slide?.subtitle;
  if (!sub) return '';
  const l = String(lng || 'fr').split('-')[0];
  if (l === 'fr') return sub;
  const n = norm(sub);
  if (l === 'en') return subtitleEn(n, sub);
  if (l === 'ar') return subtitleAr(n, sub);
  return sub;
}
