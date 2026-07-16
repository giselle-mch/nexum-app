const express = require('express')
const verifyToken = require('../middlewares/authMiddleware')
const controller = require('../controllers/conversationController')

const router = express.Router()
router.use(verifyToken)
router.post('/', controller.createConversation)
router.get('/', controller.listConversations)
router.get('/:id', controller.getConversation)
router.post('/:id/messages', controller.sendMessage)

module.exports = router
