const express = require('express')
const router = express.Router()

const upload = require('../middlewares/uploadMiddleware')
const imageController = require('../controllers/imageController')

router.post('/:id', upload.single('image'), imageController.uploadImage)

module.exports = router