/**
 * Met à jour les URLs des ProductImage (MongoDB) pour une liste de produits médicaux,
 * en résolvant les productId via MySQL (nom du produit).
 *
 * Usage (depuis BackendApi/) : npm run update:medical-images
 * Requiert .env : MONGODB_URI, MYSQL_*
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

import { connectMongoDB, getMySQLConnection } from '../config/database.js';
import ProductImage from '../models/ProductImage.js';

const URLS = {
  thermometreInfrarouge:
    'https://images.unsplash.com/photo-1585417239725-00feea715e12?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  tensiometreElectrique:
    'https://images.unsplash.com/photo-1747224317356-6dd1a4a078fd?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  stethoscopeMedical:
    'https://images.unsplash.com/photo-1655313719493-16ebe4906441?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  echographePortable:
    'https://images.unsplash.com/photo-1691935071222-c008a4ccc2ca?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  negatoscopeLed:
    'https://www.drexcomedical.fr/8139-large_default/negatoscope-extra-plat-1-2-plages-led.jpg',
  litMedicaliseElectrique:
    'https://images.unsplash.com/photo-1622878327584-40ac62f6a97b?q=80&w=1114&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  boiteGantsNitriles:
    'https://plus.unsplash.com/premium_photo-1661431328029-6644cdb0ebee?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  masquesChirurgicaux:
    'https://plus.unsplash.com/premium_photo-1725075089198-b78f625290bd?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  otoscopeFibreOptique:
    'https://plus.unsplash.com/premium_photo-1658506978519-20245a6466a3?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  glucometrePrecision:
    'https://images.unsplash.com/photo-1714642596931-2293df25c4a3?q=80&w=1028&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  marteauReflexe:
    'https://plus.unsplash.com/premium_photo-1666262811491-eb4ec08bf6f9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  autoclaveClasseB:
    'https://plus.unsplash.com/premium_photo-1661507189943-b87c6ea3589e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
};

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function urlForProductName(name) {
  const n = norm(name);
  if (n.includes('thermometre') && n.includes('infrarouge')) return URLS.thermometreInfrarouge;
  if (
    n.includes('tensiometre') &&
    (n.includes('electrique') || n.includes('electronique'))
  ) {
    return URLS.tensiometreElectrique;
  }
  if (n.includes('stethoscope') && (n.includes('medical') || n.includes('professionnel'))) {
    return URLS.stethoscopeMedical;
  }
  if (n.includes('stethoscope')) return URLS.stethoscopeMedical;
  if (n.includes('echographe') && n.includes('portable')) return URLS.echographePortable;
  if (n.includes('negatoscope') && n.includes('led')) return URLS.negatoscopeLed;
  if (n.includes('lit') && n.includes('medicalise') && n.includes('electrique')) {
    return URLS.litMedicaliseElectrique;
  }
  if (n.includes('gants') && n.includes('nitrile')) return URLS.boiteGantsNitriles;
  if (n.includes('masques') && n.includes('chirurgic')) return URLS.masquesChirurgicaux;
  if (n.includes('otoscope') && n.includes('fibre') && n.includes('optique')) {
    return URLS.otoscopeFibreOptique;
  }
  if (n.includes('glucometre') && n.includes('precision')) return URLS.glucometrePrecision;
  if (n.includes('marteau') && n.includes('reflexe')) return URLS.marteauReflexe;
  if (n.includes('autoclave') && n.includes('classe') && n.includes('b')) {
    return URLS.autoclaveClasseB;
  }
  return null;
}

async function main() {
  await connectMongoDB();
  const pool = await getMySQLConnection();
  const [rows] = await pool.execute(
    'SELECT id, name FROM products WHERE status = ?',
    ['active']
  );

  let updated = 0;
  let created = 0;

  for (const row of rows) {
    const url = urlForProductName(row.name);
    if (!url) continue;

    const productId = Number(row.id);
    const count = await ProductImage.countDocuments({ productId });

    if (count === 0) {
      await ProductImage.create({
        productId,
        url,
        alt: row.name,
        isPrimary: true,
        order: 0
      });
      created += 1;
      console.log(`+ créé image pour #${productId} — ${row.name}`);
      continue;
    }

    const res = await ProductImage.updateMany({ productId }, { $set: { url } });
    if (res.modifiedCount > 0) {
      updated += res.modifiedCount;
      console.log(`✓ ${res.modifiedCount} image(s) #${productId} — ${row.name}`);
    }
  }

  console.log(`\nTerminé : ${updated} document(s) modifié(s), ${created} créé(s).`);
  console.log('Si Elasticsearch est utilisé, lancez une réindexation admin (/products/admin/search/reindex).');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
