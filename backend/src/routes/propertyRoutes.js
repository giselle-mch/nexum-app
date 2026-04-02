const express = require('express')
const router = express.Router()

const propertyController = require('../controllers/propertyController')
const verifyToken = require('../middlewares/authMiddleware')
const checkRole = require('../middlewares/roleMiddleware')

router.post(
 '/',
 verifyToken,
 checkRole('arrendador', 'admin'),
 propertyController.createProperty
);

router.get('/', propertyController.getProperties)

router.get('/nearby', propertyController.getNearbyProperties)

router.get('/search', propertyController.searchProperties)

router.get('/:id', propertyController.getPropertyById)

module.exports = router
