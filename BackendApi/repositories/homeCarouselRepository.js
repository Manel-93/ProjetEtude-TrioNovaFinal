import { getMySQLConnection } from '../config/database.js';

export class HomeCarouselRepository {
  mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      productId: row.product_id,
      imageUrl: row.image_url || '',
      linkUrl: row.link_url || '',
      title: row.title || '',
      subtitle: row.subtitle || '',
      active: row.active === 1 || row.active === true,
      sortOrder: row.sort_order ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async findAll() {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM home_carousel_slides ORDER BY sort_order ASC, id ASC'
    );
    return rows.map((r) => this.mapRow(r));
  }

  async findAllActive() {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM home_carousel_slides WHERE active = 1 ORDER BY sort_order ASC, id ASC'
    );
    return rows.map((r) => this.mapRow(r));
  }

  async replaceAll(slides) {
    const pool = await getMySQLConnection();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('DELETE FROM home_carousel_slides');
      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        await conn.execute(
          `INSERT INTO home_carousel_slides (product_id, image_url, link_url, title, subtitle, active, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            s.productId != null && s.productId !== '' ? Number(s.productId) : null,
            s.imageUrl || null,
            s.linkUrl || null,
            s.title || null,
            s.subtitle || null,
            s.active !== false ? 1 : 0,
            typeof s.sortOrder === 'number' ? s.sortOrder : i
          ]
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    return this.findAll();
  }
}
