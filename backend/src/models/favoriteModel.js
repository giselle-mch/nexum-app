const db = require('../config/database');

const addFavorite = async (userId, propertyId) => {

  const query = `
    INSERT INTO favorites (user_id, property_id)
    VALUES ($1, $2)
    RETURNING *
  `;

  const values = [userId, propertyId];

  const result = await db.query(query, values);

  return result.rows[0];
};

const removeFavorite = async (userId, propertyId) => {

  const query = `
    DELETE FROM favorites
    WHERE user_id = $1 AND property_id = $2
  `;

  await db.query(query, [userId, propertyId]);

};

const getUserFavorites = async (userId) => {

  const query = `
    SELECT p.*
    FROM favorites f
    JOIN inmuebles p ON f.property_id = p.id
    WHERE f.user_id = $1
  `;

  const result = await db.query(query, [userId]);

  return result.rows;
};

module.exports = {
 addFavorite,
 removeFavorite,
 getUserFavorites
};