const pool = require('../config/database')

const conversationColumns = `
  c.id, c.inmueble_id, c.interesado_id, c.arrendador_id, c.creado_en, c.actualizado_en,
  i.titulo AS inmueble_titulo,
  CASE WHEN c.interesado_id = $1 THEN owner.nombre ELSE customer.nombre END AS contacto_nombre,
  (SELECT m.contenido FROM mensajes m WHERE m.conversacion_id = c.id ORDER BY m.creado_en DESC LIMIT 1) AS ultimo_mensaje,
  (SELECT m.creado_en FROM mensajes m WHERE m.conversacion_id = c.id ORDER BY m.creado_en DESC LIMIT 1) AS ultimo_mensaje_en,
  (SELECT COUNT(*) FROM mensajes m WHERE m.conversacion_id = c.id AND m.remitente_id <> $1 AND m.leido_en IS NULL) AS no_leidos
`

const Chat = {
  async findOrCreateForProperty(propertyId, interestedId) {
    const property = await pool.query(
      'SELECT id, propietario_id FROM inmuebles WHERE id = $1',
      [propertyId]
    )
    const row = property.rows[0]
    if (!row) return { error: 'NOT_FOUND' }
    if (Number(row.propietario_id) === Number(interestedId)) return { error: 'OWN_PROPERTY' }

    const result = await pool.query(
      `INSERT INTO conversaciones (inmueble_id, interesado_id, arrendador_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (inmueble_id, interesado_id)
       DO UPDATE SET actualizado_en = conversaciones.actualizado_en
       RETURNING *`,
      [propertyId, interestedId, row.propietario_id]
    )
    return { conversation: result.rows[0] }
  },

  async listForUser(userId) {
    const result = await pool.query(
      `SELECT ${conversationColumns}
       FROM conversaciones c
       JOIN inmuebles i ON i.id = c.inmueble_id
       JOIN usuarios owner ON owner.id = c.arrendador_id
       JOIN usuarios customer ON customer.id = c.interesado_id
       WHERE c.interesado_id = $1 OR c.arrendador_id = $1
       ORDER BY COALESCE((SELECT MAX(m.creado_en) FROM mensajes m WHERE m.conversacion_id = c.id), c.creado_en) DESC`,
      [userId]
    )
    return result.rows
  },

  async isParticipant(conversationId, userId) {
    const result = await pool.query(
      'SELECT * FROM conversaciones WHERE id = $1 AND ($2 = interesado_id OR $2 = arrendador_id)',
      [conversationId, userId]
    )
    return result.rows[0] || null
  },

  async listMessages(conversationId) {
    const result = await pool.query(
      `SELECT m.*, u.nombre AS remitente_nombre
       FROM mensajes m JOIN usuarios u ON u.id = m.remitente_id
       WHERE m.conversacion_id = $1 ORDER BY m.creado_en ASC`,
      [conversationId]
    )
    return result.rows
  },

  async createMessage({ conversationId, senderId, content, type = 'texto', file }) {
    const result = await pool.query(
      `INSERT INTO mensajes
       (conversacion_id, remitente_id, contenido, tipo, archivo_url, archivo_nombre, archivo_mime)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [conversationId, senderId, content || null, type, file?.url || null, file?.name || null, file?.mime || null]
    )
    await pool.query('UPDATE conversaciones SET actualizado_en = CURRENT_TIMESTAMP WHERE id = $1', [conversationId])
    return result.rows[0]
  },

  async markRead(conversationId, userId) {
    await pool.query(
      `UPDATE mensajes SET leido_en = CURRENT_TIMESTAMP
       WHERE conversacion_id = $1 AND remitente_id <> $2 AND leido_en IS NULL`,
      [conversationId, userId]
    )
  }
}

module.exports = Chat
