const express = require('express')
const router = express.Router()

const propertyController = require('../controllers/propertyController')
const verifyToken = require('../middlewares/authMiddleware')

router.post('/', verifyToken, propertyController.createProperty)

router.get('/', propertyController.getProperties)

router.get('/:id', propertyController.getPropertyById)

module.exports = router