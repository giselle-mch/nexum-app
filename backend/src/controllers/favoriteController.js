const favoriteModel = require('../models/favoriteModel');

const addFavorite = async (req, res) => {

  try {

    const userId = req.user.id;
    const { propertyId } = req.params;

    const favorite = await favoriteModel.addFavorite(userId, propertyId);

    res.status(201).json(favorite);

  } catch (error) {

    console.error("Error agregando favorito:", error);
    res.status(500).json({ error: "Error agregando favorito" });

  }

};

const removeFavorite = async (req, res) => {

  try {

    const userId = req.user.id;
    const { propertyId } = req.params;

    await favoriteModel.removeFavorite(userId, propertyId);

    res.json({ message: "Favorito eliminado" });

  } catch (error) {

    res.status(500).json({ error: "Error eliminando favorito" });

  }

};

const getFavorites = async (req, res) => {

  try {

    const userId = req.user.id;

    const favorites = await favoriteModel.getUserFavorites(userId);

    res.json(favorites);

  } catch (error) {

    res.status(500).json({ error: "Error obteniendo favoritos" });

  }

};

module.exports = {
 addFavorite,
 removeFavorite,
 getFavorites
};
