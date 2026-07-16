const Conversation = require('../models/conversationModel')

const parseId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const createConversation = async (req, res) => {
  const propertyId = parseId(req.body.propertyId)
  if (!propertyId) return res.status(400).json({ message: 'Inmueble inválido' })
  try {
    const conversation = await Conversation.createForProperty(propertyId, req.user.id)
    if (!conversation) {
      return res.status(400).json({ message: 'No puedes iniciar esta conversación' })
    }
    return res.status(201).json(conversation)
  } catch (error) {
    console.error('Error en createConversation:', error)
    return res.status(500).json({ message: 'Error creando conversación' })
  }
}

const listConversations = async (req, res) => {
  try {
    return res.json(await Conversation.findForUser(req.user.id))
  } catch (error) {
    console.error('Error en listConversations:', error)
    return res.status(500).json({ message: 'Error obteniendo conversaciones' })
  }
}

const getConversation = async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'Conversación inválida' })
  try {
    const conversation = await Conversation.findParticipant(id, req.user.id)
    if (!conversation) return res.status(404).json({ message: 'Conversación no encontrada' })
    const messages = await Conversation.getMessages(id)
    return res.json({ conversation, messages })
  } catch (error) {
    console.error('Error en getConversation:', error)
    return res.status(500).json({ message: 'Error obteniendo conversación' })
  }
}

const sendMessage = async (req, res) => {
  const id = parseId(req.params.id)
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : ''
  if (!id) return res.status(400).json({ message: 'Conversación inválida' })
  if (!content || content.length > 2000) {
    return res.status(400).json({ message: 'El mensaje debe contener entre 1 y 2000 caracteres' })
  }
  try {
    const message = await Conversation.addMessage(id, req.user.id, content)
    if (!message) return res.status(404).json({ message: 'Conversación no encontrada' })
    return res.status(201).json(message)
  } catch (error) {
    console.error('Error en sendMessage:', error)
    return res.status(500).json({ message: 'Error enviando mensaje' })
  }
}

module.exports = { createConversation, listConversations, getConversation, sendMessage, parseId }
