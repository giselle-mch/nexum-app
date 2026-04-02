const express = require('express')
const router = express.Router()

const propertyController = require('../controllers/propertyController')
const verifyToken = require('../middlewares/authMiddleware')

router.post('/', verifyToken, propertyController.createProperty)

router.get('/', propertyController.getProperties)

router.get('/nearby', propertyController.getNearbyProperties)

router.get('/search', propertyController.searchProperties)

router.get('/:id', propertyController.getPropertyById)

router.get('/nearby', propertyController.getNearbyProperties);

module.exports = router
