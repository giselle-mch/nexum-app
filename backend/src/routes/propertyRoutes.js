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

router.get('/detail/:id', propertyController.getPropertyDetail)

router.get(
 '/mine',
 verifyToken,
 checkRole('arrendador','admin'),
 propertyController.getMyProperties
);

router.put(
 '/mine/:id',
 verifyToken,
 checkRole('arrendador','admin'),
 propertyController.updateMyProperty
);

router.delete(
 '/mine/:id',
 verifyToken,
 checkRole('arrendador','admin'),
 propertyController.deleteMyProperty
);

router.get('/:id', propertyController.getPropertyById)

module.exports = router
