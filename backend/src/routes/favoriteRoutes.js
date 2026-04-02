const express = require('express');
const router = express.Router();

const {
 addFavorite,
 removeFavorite,
 getFavorites
} = require('../controllers/favoriteController');

const verifyToken = require('../middlewares/authMiddleware');

router.post('/:propertyId', verifyToken, addFavorite);

router.delete('/:propertyId', verifyToken, removeFavorite);

router.get('/', verifyToken, getFavorites);

module.exports = router;