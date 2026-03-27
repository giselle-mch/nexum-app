const pool = require('../config/database')

const Property = {

  async create(property) {

    const query = `
      INSERT INTO inmuebles
      (titulo, descripcion, precio, tipo, direccion, ciudad, latitud, longitud, propietario_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `

    const values = [
      property.titulo,
      property.descripcion,
      property.precio,
      property.tipo,
      property.direccion,
      property.ciudad,
      property.latitud,
      property.longitud,
      property.propietario_id
    ]

    const result = await pool.query(query, values)

    return result.rows[0]

  },

  async findAll() {

    const result = await pool.query(
      'SELECT * FROM inmuebles ORDER BY creado_en DESC'
    )

    return result.rows

  },

  async findById(id) {

    const result = await pool.query(
      'SELECT * FROM inmuebles WHERE id = $1',
      [id]
    )

    return result.rows[0]

  }

}

module.exports = Property