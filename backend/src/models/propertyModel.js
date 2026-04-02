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
          json_agg(DISTINCT pi.image_url) 
          FILTER (WHERE pi.image_url IS NOT NULL),
          '[]'::json
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
          json_agg(DISTINCT pi.image_url) 
          FILTER (WHERE pi.image_url IS NOT NULL),
          '[]'::json
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
          json_agg(DISTINCT pi.image_url) 
          FILTER (WHERE pi.image_url IS NOT NULL),
          '[]'::json
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

  async findForMap({ minLat, maxLat, minLng, maxLng, limit }) {

    let query = `
      SELECT
        p.id,
        p.titulo,
        p.precio,
        p.latitud,
        p.longitud,
        (
          SELECT pi.image_url
          FROM property_images pi
          WHERE pi.property_id = p.id
          ORDER BY pi.id ASC
          LIMIT 1
        ) AS imagen_principal
      FROM inmuebles p
      WHERE p.latitud IS NOT NULL
        AND p.longitud IS NOT NULL
    `

    const values = []
    let index = 1

    if (minLat !== undefined) {
      query += ` AND p.latitud >= $${index}`
      values.push(minLat)
      index++
    }

    if (maxLat !== undefined) {
      query += ` AND p.latitud <= $${index}`
      values.push(maxLat)
      index++
    }

    if (minLng !== undefined) {
      query += ` AND p.longitud >= $${index}`
      values.push(minLng)
      index++
    }

    if (maxLng !== undefined) {
      query += ` AND p.longitud <= $${index}`
      values.push(maxLng)
      index++
    }

    query += ' ORDER BY p.creado_en DESC'

    if (limit !== undefined) {
      query += ` LIMIT $${index}`
      values.push(limit)
      index++
    }

    const result = await pool.query(query, values)

    return result.rows
  },

  async search(filters) {

    let query = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(DISTINCT pi.image_url) 
          FILTER (WHERE pi.image_url IS NOT NULL),
          '[]'::json
        ) AS imagenes
      FROM inmuebles p
      LEFT JOIN property_images pi
      ON p.id = pi.property_id
      WHERE 1=1
    `
    const values = []
    let index = 1

    if (filters.ciudad) {
        query += ` AND p.ciudad ILIKE $${index}`
        values.push(`%${filters.ciudad}%`)
        index++
    }

    if (filters.tipo) {
        query += ` AND p.tipo = $${index}`
        values.push(filters.tipo)
        index++
    }

    if (filters.precio_min) {
        query += ` AND p.precio >= $${index}`
        values.push(filters.precio_min)
        index++
    }

    if (filters.precio_max) {
        query += ` AND p.precio <= $${index}`
        values.push(filters.precio_max)
        index++
    }

    query += ' GROUP BY p.id ORDER BY p.creado_en DESC'

    const result = await pool.query(query, values)

    return result.rows
  },

  async getPropertiesByUser(userId) {

    const query = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(DISTINCT pi.image_url) 
          FILTER (WHERE pi.image_url IS NOT NULL),
          '[]'::json
        ) AS imagenes
      FROM inmuebles p
      LEFT JOIN property_images pi
      ON p.id = pi.property_id
      WHERE p.propietario_id = $1
      GROUP BY p.id
      ORDER BY p.creado_en DESC
    `

    const result = await pool.query(query, [userId])

    return result.rows

  },

  async updateByIdAndOwner(propertyId, ownerId, updates) {

    const allowedFields = [
      'titulo',
      'descripcion',
      'precio',
      'tipo',
      'direccion',
      'ciudad',
      'latitud',
      'longitud',
      'telefono_contacto'
    ]

    const setClauses = []
    const values = []
    let index = 1

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        setClauses.push(`${field} = $${index}`)
        values.push(updates[field])
        index++
      }
    }

    if (setClauses.length === 0) {
      return null
    }

    values.push(propertyId, ownerId)

    const query = `
      UPDATE inmuebles
      SET ${setClauses.join(', ')}
      WHERE id = $${index} AND propietario_id = $${index + 1}
      RETURNING *
    `

    const result = await pool.query(query, values)

    return result.rows[0] || null

  },

  async deleteByIdAndOwner(propertyId, ownerId) {

    const query = `
      DELETE FROM inmuebles
      WHERE id = $1 AND propietario_id = $2
      RETURNING *
    `

    const result = await pool.query(query, [propertyId, ownerId])

    return result.rows[0] || null

  }

}

module.exports = Property
