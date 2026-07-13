const express = require('express')
const verifyToken = require('../middlewares/authMiddleware')
const upload = require('../middlewares/uploadMiddleware')
const chatController = require('../controllers/chatController')

const router = express.Router()

router.use(verifyToken)
router.get('/', chatController.listConversations)
router.post('/properties/:propertyId', chatController.createConversation)
router.get('/:id/messages', chatController.listMessages)
router.post('/:id/messages', chatController.sendMessage)
router.post('/:id/media', upload.single('attachment'), chatController.sendMedia)

module.exports = router
