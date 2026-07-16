const pool = require('../config/database')

const paymentSelect = `
  SELECT rp.id, rp.conversation_id, rp.property_id, rp.client_id, rp.landlord_id,
    rp.amount, rp.due_date, rp.paid_at, rp.created_at, rp.reference,
    CASE WHEN rp.status = 'pendiente' AND rp.due_date < CURRENT_DATE
      THEN 'vencido' ELSE rp.status END AS status,
    p.titulo AS property_title, client.nombre AS client_name,
    landlord.nombre AS landlord_name
  FROM rent_payments rp
  JOIN inmuebles p ON p.id = rp.property_id
  JOIN usuarios client ON client.id = rp.client_id
  JOIN usuarios landlord ON landlord.id = rp.landlord_id
`

const Payment = {
  async create({ conversationId, landlordId, amount, dueDate, reference }) {
    const result = await pool.query(`
      INSERT INTO rent_payments
        (conversation_id, property_id, client_id, landlord_id, amount, due_date, reference)
      SELECT c.id, c.property_id, c.client_id, c.landlord_id, $3, $4, $5
      FROM conversations c
      WHERE c.id = $1 AND c.landlord_id = $2
      RETURNING id
    `, [conversationId, landlordId, amount, dueDate, reference])
    return result.rows[0]
  },

  async findForUser(userId) {
    const result = await pool.query(`${paymentSelect}
      WHERE rp.client_id = $1 OR rp.landlord_id = $1
      ORDER BY rp.created_at DESC
    `, [userId])
    return result.rows
  },

  async markPaid(id, clientId) {
    const result = await pool.query(`
      UPDATE rent_payments SET status = 'pagado', paid_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND client_id = $2 AND status = 'pendiente'
        AND due_date >= CURRENT_DATE
      RETURNING id, status, paid_at, reference
    `, [id, clientId])
    return result.rows[0]
  },

  async cancel(id, landlordId) {
    const result = await pool.query(`
      UPDATE rent_payments SET status = 'cancelado'
      WHERE id = $1 AND landlord_id = $2 AND status = 'pendiente'
      RETURNING id, status
    `, [id, landlordId])
    return result.rows[0]
  }
}

module.exports = Payment
