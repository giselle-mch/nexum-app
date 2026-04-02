const pool = require('../config/database')

const Property = {

  async create(property) {

    const query = `
      INSERT INTO inmuebles
      (titulo, descripcion, precio, tipo, direccion, ciudad, latitud, longitud, telefono_contacto, propietario_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
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
      property.telefono_contacto,
      property.propietario_id
    ]

    const result = await pool.query(query, values)

    return result.rows[0]

  },

  async findAll() {

    const query = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(pi.image_url) 
          FILTER (WHERE pi.image_url IS NOT NULL),
          '[]'
        ) AS imagenes
      FROM inmuebles p
      LEFT JOIN property_images pi
      ON p.id = pi.property_id
      GROUP BY p.id
      ORDER BY p.creado_en DESC
    `

    const result = await pool.query(query)

    return result.rows
  },

  async findById(id) {

    const query = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(pi.image_url) 
          FILTER (WHERE pi.image_url IS NOT NULL),
          '[]'
        ) AS imagenes
      FROM inmuebles p
      LEFT JOIN property_images pi
      ON p.id = pi.property_id
      WHERE p.id = $1
      GROUP BY p.id
    `

    const result = await pool.query(query, [id])

    return result.rows[0]
  },

  async findNearby({ lat, lng, radius }) {

    const query = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(pi.image_url) 
          FILTER (WHERE pi.image_url IS NOT NULL),
          '[]'
        ) AS imagenes,
        (
          6371 * acos(
            cos(radians($1)) * cos(radians(p.latitud)) * cos(radians(p.longitud) - radians($2)) +
            sin(radians($1)) * sin(radians(p.latitud))
          )
        ) AS distancia_km
      FROM inmuebles p
      LEFT JOIN property_images pi
      ON p.id = pi.property_id
      GROUP BY p.id
      HAVING (
        6371 * acos(
          cos(radians($1)) * cos(radians(p.latitud)) * cos(radians(p.longitud) - radians($2)) +
          sin(radians($1)) * sin(radians(p.latitud))
        )
      ) <= $3
      ORDER BY distancia_km ASC
    `

    const result = await pool.query(query, [lat, lng, radius])

    return result.rows
  },

  async search(filters) {

    let query = 'SELECT * FROM inmuebles WHERE 1=1'
    const values = []
    let index = 1

    if (filters.ciudad) {
        query += ` AND ciudad ILIKE $${index}`
        values.push(`%${filters.ciudad}%`)
        index++
    }

    if (filters.tipo) {
        query += ` AND tipo = $${index}`
        values.push(filters.tipo)
        index++
    }

    if (filters.precio_min) {
        query += ` AND precio >= $${index}`
        values.push(filters.precio_min)
        index++
    }

    if (filters.precio_max) {
        query += ` AND precio <= $${index}`
        values.push(filters.precio_max)
        index++
    }

    query += ' ORDER BY creado_en DESC'

    const result = await pool.query(query, values)

    return result.rows
    
    }

}

module.exports = Property
