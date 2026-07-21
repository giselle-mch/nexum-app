const express = require('express')
const router = express.Router()

const authController = require('../controllers/authController')
const verifyToken = require('../middlewares/authMiddleware')

router.get('/user-profile', verifyToken, authController.getUserProfile)

module.exports = router
