/**
 * Supprime le produit doublon « Tensiomètre de bras électronique » (MySQL + images Mongo + ES).
 * Refuse si le produit apparaît encore dans des commandes (order_items).
 *
 * Usage (depuis BackendApi/) : npm run remove:tensiometre-bras
 * Forcer un id précis : DELETE_PRODUCT_ID=22 npm run remove:tensiometre-bras
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

import { connectMongoDB, getMySQLConnection } from '../config/database.js';
import { ProductService } from '../services/productService.js';

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** Doublon « au bras » : nom ou slug contient tensiomètre + bras (pas le tensiomètre générique sans bras). */
function isArmBpProduct(row) {
  const n = norm(row.name);
  const s = norm(row.slug || '');
  const tensio = n.includes('tensiometre') || s.includes('tensiometre');
  const bras = n.includes('bras') || s.includes('bras');
  return tensio && bras;
}

async function main() {
  await connectMongoDB();
  await getMySQLConnection();
  const pool = await getMySQLConnection();
  const explicitId = process.env.DELETE_PRODUCT_ID;
  if (explicitId) {
    const id = parseInt(explicitId, 10);
    if (!Number.isFinite(id)) {
      console.error('DELETE_PRODUCT_ID invalide.');
      process.exit(1);
    }
    const [[ref]] = await pool.execute(
      'SELECT COUNT(*) as c FROM order_items WHERE product_id = ?',
      [id]
    );
    if (Number(ref.c) > 0) {
      console.error(`Refus : #${id} a ${ref.c} ligne(s) de commande.`);
      process.exit(1);
    }
    const svc = new ProductService();
    await svc.deleteProduct(id);
    console.log(`Supprimé #${id} (DELETE_PRODUCT_ID).`);
    process.exit(0);
  }

  const [rows] = await pool.execute('SELECT id, name, slug FROM products');

  const targets = rows.filter((row) => isArmBpProduct(row));

  if (targets.length === 0) {
    console.log(
      'Aucun produit avec tensiomètre + « bras » dans le nom ou le slug. ' +
        'S’il existe encore, supprime-le via l’admin ou : DELETE_PRODUCT_ID=<id> npm run remove:tensiometre-bras'
    );
    process.exit(0);
  }

  const svc = new ProductService();

  for (const t of targets) {
    const [[ref]] = await pool.execute(
      'SELECT COUNT(*) as c FROM order_items WHERE product_id = ?',
      [t.id]
    );
    if (Number(ref.c) > 0) {
      console.error(
        `Refus : le produit #${t.id} « ${t.name} » est lié à ${ref.c} ligne(s) de commande.`
      );
      process.exit(1);
    }

    await svc.deleteProduct(t.id);
    console.log(`Supprimé #${t.id} — ${t.name}`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
