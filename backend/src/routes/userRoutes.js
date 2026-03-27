const express = require('express')
const router = express.Router()

const User = require('../models/userModel')
const verifyToken = require('../middlewares/authMiddleware')

router.get('/test-user', async (req, res) => {

  const user = await User.findByEmail('test@nexum.com')

  res.json(user)

})

router.get('/profile', verifyToken, (req, res) => {

  res.json({
    message: "Perfil del usuario autenticado",
    user: req.user
  })

})

module.exports = router