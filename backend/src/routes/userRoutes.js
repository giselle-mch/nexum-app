const express = require('express')
const router = express.Router()
const User = require('../models/userModel')

router.get('/test-user', async (req, res) => {

  const user = await User.findByEmail('test@nexum.com')

  res.json(user)

})

module.exports = router