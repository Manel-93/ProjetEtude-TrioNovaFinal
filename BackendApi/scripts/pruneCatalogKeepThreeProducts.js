/**
 * Désactive tous les produits du catalogue sauf trois références médicales :
 * stéthoscope professionnel, thermomètre infrarouge, tensiomètre électrique.
 *
 * Usage (depuis BackendApi/) : npm run catalog:keep-three
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

import { getMySQLConnection } from '../config/database.js';

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function isKeptProduct(name) {
  const n = norm(name);
  const thermo = n.includes('thermometre') && n.includes('infrarouge');
  const tensio =
    n.includes('tensiometre') &&
    (n.includes('electrique') || n.includes('electronique')) &&
    !n.includes('bras');
  const steth =
    n.includes('stethoscope') &&
    (n.includes('professionnel') || n.includes('professionel') || n.includes('medical'));
  return thermo || tensio || steth;
}

async function main() {
  const pool = await getMySQLConnection();
  const [rows] = await pool.execute('SELECT id, name, status FROM products ORDER BY id');
  const kept = [];
  const removed = [];
  for (const row of rows) {
    if (isKeptProduct(row.name)) {
      kept.push(row);
      if (row.status !== 'active') {
        await pool.execute('UPDATE products SET status = ? WHERE id = ?', ['active', row.id]);
      }
    } else {
      removed.push(row);
      await pool.execute('UPDATE products SET status = ? WHERE id = ?', ['inactive', row.id]);
    }
  }
  console.log('Produits conservés (actifs) :');
  kept.forEach((p) => console.log(`  #${p.id} ${p.name}`));
  console.log(`\nProduits désactivés : ${removed.length}`);
  if (!kept.length) {
    console.warn(
      '\n⚠ Aucun produit ne correspond aux critères (noms en base). Vérifiez les intitulés exacts.'
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
