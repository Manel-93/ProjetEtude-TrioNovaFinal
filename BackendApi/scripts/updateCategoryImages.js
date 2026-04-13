/**
 * Met à jour categories.image_url (MySQL) pour les visuels de catégories vitrine.
 * Usage (depuis BackendApi/) : npm run update:category-images
 * Requiert .env : MYSQL_* ; la colonne image_url est créée au démarrage API (initializeDatabases).
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

import { getMySQLConnection } from '../config/database.js';

const URLS = {
  imagerieMedicale:
    'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  mobilierMedical:
    'https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  consommablesMedicaux:
    'https://images.unsplash.com/photo-1603398938378-e54eab446dde?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  dispositifsDiagnostic:
    'https://images.unsplash.com/photo-1624004015322-a94d3a4eff39?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  sterilisationHygiene:
    'https://images.unsplash.com/photo-1628246979652-d4a5fa2d0245?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
};

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function urlForCategory(row) {
  const n = norm(`${row.name} ${row.slug || ''}`);
  if (n.includes('imagerie') && n.includes('medic')) return URLS.imagerieMedicale;
  if (n.includes('mobilier') && n.includes('medic')) return URLS.mobilierMedical;
  if (
    (n.includes('consommable') || n.includes('consommables')) &&
    n.includes('medic')
  ) {
    return URLS.consommablesMedicaux;
  }
  if (n.includes('dispositif') && n.includes('diagnostic')) return URLS.dispositifsDiagnostic;
  if (n.includes('sterilisation') && n.includes('hygiene')) return URLS.sterilisationHygiene;
  return null;
}

async function ensureImageUrlColumn(pool) {
  const db = process.env.MYSQL_DATABASE || 'trio_nova_db';
  const [cols] = await pool.execute(
    `
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'image_url'
    `,
    [db]
  );
  if (cols.length === 0) {
    await pool.execute(
      `ALTER TABLE categories ADD COLUMN image_url VARCHAR(2048) NULL DEFAULT NULL`
    );
    console.log('Colonne categories.image_url ajoutée.');
  }
}

async function main() {
  const pool = await getMySQLConnection();
  await ensureImageUrlColumn(pool);

  const [rows] = await pool.execute(
    'SELECT id, name, slug FROM categories WHERE status = ?',
    ['active']
  );

  let n = 0;
  for (const row of rows) {
    const url = urlForCategory(row);
    if (!url) continue;
    const [res] = await pool.execute(
      'UPDATE categories SET image_url = ? WHERE id = ?',
      [url, row.id]
    );
    if (res.affectedRows > 0) {
      n += 1;
      console.log(`✓ #${row.id} — ${row.name}`);
    }
  }

  console.log(`\nTerminé : ${n} catégorie(s) mise(s) à jour.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
