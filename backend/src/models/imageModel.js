const pool = require('../config/database')

const Image = {

  async add(property_id, image_url) {

    const query = `
      INSERT INTO property_images(property_id, image_url)
      VALUES($1,$2)
      RETURNING *
    `

    const values = [property_id, image_url]

    const result = await pool.query(query, values)

    return result.rows[0]
  },

  async findByProperty(property_id) {

    const query = `
      SELECT * FROM property_images
      WHERE property_id = $1
    `

    const result = await pool.query(query, [property_id])

    return result.rows
  }

}

module.exports = Image