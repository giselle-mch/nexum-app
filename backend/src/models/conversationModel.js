const pool = require('../config/database')

const summarySelect = `
  SELECT c.id, c.property_id, c.client_id, c.landlord_id, c.created_at, c.updated_at,
    p.titulo AS property_title,
    client.nombre AS client_name,
    landlord.nombre AS landlord_name,
    last_message.content AS last_message,
    last_message.sent_at AS last_message_at
  FROM conversations c
  JOIN inmuebles p ON p.id = c.property_id
  JOIN usuarios client ON client.id = c.client_id
  JOIN usuarios landlord ON landlord.id = c.landlord_id
  LEFT JOIN LATERAL (
    SELECT content, sent_at FROM messages
    WHERE conversation_id = c.id ORDER BY sent_at DESC, id DESC LIMIT 1
  ) last_message ON true
`

const Conversation = {
  async createForProperty(propertyId, clientId) {
    const result = await pool.query(`
      INSERT INTO conversations (property_id, client_id, landlord_id)
      SELECT id, $2, propietario_id FROM inmuebles
      WHERE id = $1 AND propietario_id <> $2
      ON CONFLICT (property_id, client_id)
      DO UPDATE SET updated_at = conversations.updated_at
      RETURNING id
    `, [propertyId, clientId])
    return result.rows[0]
  },

  async findForUser(userId) {
    const result = await pool.query(`${summarySelect}
      WHERE c.client_id = $1 OR c.landlord_id = $1
      ORDER BY COALESCE(last_message.sent_at, c.updated_at) DESC
    `, [userId])
    return result.rows
  },

  async findParticipant(conversationId, userId) {
    const result = await pool.query(`${summarySelect}
      WHERE c.id = $1 AND (c.client_id = $2 OR c.landlord_id = $2)
    `, [conversationId, userId])
    return result.rows[0]
  },

  async getMessages(conversationId) {
    const result = await pool.query(`
      SELECT m.id, m.conversation_id, m.sender_id, u.nombre AS sender_name,
        m.content, m.sent_at
      FROM messages m
      JOIN usuarios u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
      ORDER BY m.sent_at ASC, m.id ASC
    `, [conversationId])
    return result.rows
  },

  async addMessage(conversationId, senderId, content) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await client.query(`
        INSERT INTO messages (conversation_id, sender_id, content)
        SELECT id, $2, $3 FROM conversations
        WHERE id = $1 AND (client_id = $2 OR landlord_id = $2)
        RETURNING id, conversation_id, sender_id, content, sent_at
      `, [conversationId, senderId, content])
      if (result.rows[0]) {
        await client.query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [conversationId])
      }
      await client.query('COMMIT')
      return result.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

module.exports = Conversation
