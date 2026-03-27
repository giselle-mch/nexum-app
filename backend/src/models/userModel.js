const pool = require('../config/database')

const User = {

  async create(user) {

    const query = `
      INSERT INTO usuarios (nombre, email, password, telefono, rol)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `

    const values = [
      user.nombre,
      user.email,
      user.password,
      user.telefono,
      user.rol
    ]

    const result = await pool.query(query, values)

    return result.rows[0]
  },

  async findByEmail(email) {

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    )

    return result.rows[0]

  }

}

module.exports = User