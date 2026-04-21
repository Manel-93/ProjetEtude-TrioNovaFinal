function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function pickNameEn(n, fallback) {
  if ((n.includes('equipement') || n.includes('equipements')) && n.includes('medic')) {
    return 'Medical equipment';
  }
  if (n.includes('imagerie') && n.includes('medic')) return 'Medical imaging';
  if (n.includes('mobilier') && n.includes('medic')) return 'Medical furniture';
  if ((n.includes('consommable') || n.includes('consommables')) && n.includes('medic')) {
    return 'Medical consumables';
  }
  if (n.includes('dispositif') && n.includes('diagnostic')) return 'Diagnostic devices';
  if (n.includes('sterilisation') && n.includes('hygiene')) return 'Sterilization & hygiene';
  return fallback;
}

function pickNameAr(n, fallback) {
  if ((n.includes('equipement') || n.includes('equipements')) && n.includes('medic')) {
    return 'معدات طبية';
  }
  if (n.includes('imagerie') && n.includes('medic')) return 'التصوير الطبي';
  if (n.includes('mobilier') && n.includes('medic')) return 'الأثاث الطبي';
  if ((n.includes('consommable') || n.includes('consommables')) && n.includes('medic')) {
    return 'المستهلكات الطبية';
  }
  if (n.includes('dispositif') && n.includes('diagnostic')) return 'أجهزة التشخيص';
  if (n.includes('sterilisation') && n.includes('hygiene')) return 'التعقيم والنظافة';
  return fallback;
}

function pickDescEn(n, fallback) {
  if (n.includes('tous') && n.includes('equipement') && n.includes('medic') && n.includes('professionnel')) {
    return 'All professional medical equipment.';
  }
  if (n.includes('imagerie') && n.includes('medic')) {
    return 'Scanners, ultrasound, detectors and imaging accessories.';
  }
  if (n.includes('mobilier') && n.includes('medic')) {
    return 'Beds, examination tables, trolleys and clinic layout.';
  }
  if ((n.includes('consommable') || n.includes('consommables')) && n.includes('medic')) {
    return 'Gloves, syringes, masks and single-use supplies.';
  }
  if (n.includes('dispositif') && n.includes('diagnostic')) {
    return 'Thermometers, blood pressure monitors, stethoscopes and examination tools.';
  }
  if (n.includes('sterilisation') && n.includes('hygiene')) {
    return 'Autoclaves, disinfection and hygiene equipment.';
  }
  return fallback;
}

function pickDescAr(n, fallback) {
  if (n.includes('imagerie') && n.includes('medic')) {
    return 'أجهزة التصوير والموجات فوق الصوتية ومستلزمات التصوير الطبي.';
  }
  if (n.includes('mobilier') && n.includes('medic')) {
    return 'أسرة وطاولات فحص وعربات وتجهيزات العيادات.';
  }
  if ((n.includes('consommable') || n.includes('consommables')) && n.includes('medic')) {
    return 'قفازات ومحاقن وكمامات ومستلزمات لمرة واحدة.';
  }
  if (n.includes('dispositif') && n.includes('diagnostic')) {
    return 'موازين حرارة وأجهزة ضغط وسماعات طبية وأدوات الفحص.';
  }
  if (n.includes('sterilisation') && n.includes('hygiene')) {
    return 'معقمات وتعقيم ومعدات النظافة.';
  }
  return fallback;
}

/**
 * @param {{ name?: string, slug?: string, nameEn?: string, nameAr?: string } | null} category
 * @param {string} [lng]
 */
export function getCategoryDisplayName(category, lng) {
  if (!category?.name) return '';
  const l = String(lng || 'fr').split('-')[0];
  if (l === 'fr') return category.name;
  if (l === 'en' && category.nameEn) return category.nameEn;
  if (l === 'ar' && category.nameAr) return category.nameAr;
  const n = norm(`${category.slug || ''} ${category.name}`);
  if (l === 'en') return pickNameEn(n, category.name);
  if (l === 'ar') return pickNameAr(n, category.name);
  return category.name;
}

/**
 * @param {{ description?: string, slug?: string, name?: string } | null} category
 * @param {string} [lng]
 */
export function getCategoryDisplayDescription(category, lng) {
  const desc = category?.description;
  if (!desc) return '';
  const l = String(lng || 'fr').split('-')[0];
  if (l === 'fr') return desc;
  const n = norm(`${category.slug || ''} ${category.name || ''} ${desc}`);
  if (l === 'en') return pickDescEn(n, desc);
  if (l === 'ar') return pickDescAr(n, desc);
  return desc;
}
