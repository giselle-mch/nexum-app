const express = require('express')
const verifyToken = require('../middlewares/authMiddleware')
const controller = require('../controllers/paymentController')

const router = express.Router()
router.use(verifyToken)
router.post('/', controller.createPayment)
router.get('/', controller.listPayments)
router.post('/:id/simulate', controller.simulatePayment)
router.post('/:id/cancel', controller.cancelPayment)

module.exports = router
