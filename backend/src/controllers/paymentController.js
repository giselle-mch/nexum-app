const crypto = require('crypto')
const Payment = require('../models/paymentModel')

const parseId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const createPayment = async (req, res) => {
  const conversationId = parseId(req.body.conversationId)
  const amount = Number(req.body.amount)
  const dueDate = typeof req.body.dueDate === 'string' ? req.body.dueDate : ''
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(dueDate) && !Number.isNaN(Date.parse(`${dueDate}T00:00:00`))
  if (!conversationId || !Number.isFinite(amount) || amount <= 0 || amount > 9999999999.99 || !validDate) {
    return res.status(400).json({ message: 'Conversación, monto y fecha límite válidos son requeridos' })
  }
  try {
    const reference = `NEXUM-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    const payment = await Payment.create({ conversationId, landlordId: req.user.id, amount, dueDate, reference })
    if (!payment) return res.status(404).json({ message: 'Conversación no encontrada' })
    return res.status(201).json({ ...payment, reference })
  } catch (error) {
    console.error('Error en createPayment:', error)
    return res.status(500).json({ message: 'Error creando cobro' })
  }
}

const listPayments = async (req, res) => {
  try { return res.json(await Payment.findForUser(req.user.id)) }
  catch (error) {
    console.error('Error en listPayments:', error)
    return res.status(500).json({ message: 'Error obteniendo pagos' })
  }
}

const simulatePayment = async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'Pago inválido' })
  try {
    const payment = await Payment.markPaid(id, req.user.id)
    if (!payment) return res.status(409).json({ message: 'El pago no está disponible para procesarse' })
    return res.json({ message: 'Pago simulado correctamente', payment })
  } catch (error) {
    console.error('Error en simulatePayment:', error)
    return res.status(500).json({ message: 'Error procesando pago' })
  }
}

const cancelPayment = async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'Pago inválido' })
  try {
    const payment = await Payment.cancel(id, req.user.id)
    if (!payment) return res.status(409).json({ message: 'El cobro no está disponible para cancelarse' })
    return res.json({ message: 'Cobro cancelado', payment })
  } catch (error) {
    console.error('Error en cancelPayment:', error)
    return res.status(500).json({ message: 'Error cancelando cobro' })
  }
}

module.exports = { createPayment, listPayments, simulatePayment, cancelPayment, parseId }
