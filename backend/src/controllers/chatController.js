const Chat = require('../models/chatModel')

const allowedTypes = new Set(['texto', 'imagen', 'video', 'audio', 'archivo'])

const parseId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const createConversation = async (req, res) => {
  const propertyId = parseId(req.params.propertyId)
  if (!propertyId) return res.status(400).json({ message: 'ID de inmueble inválido' })

  try {
    const result = await Chat.findOrCreateForProperty(propertyId, req.user.id)
    if (result.error === 'NOT_FOUND') return res.status(404).json({ message: 'Inmueble no encontrado' })
    if (result.error === 'OWN_PROPERTY') return res.status(400).json({ message: 'No puedes abrir un chat para tu propio inmueble' })
    return res.status(201).json(result.conversation)
  } catch {
    return res.status(500).json({ message: 'No fue posible crear la conversación' })
  }
}

const listConversations = async (req, res) => {
  try {
    res.json(await Chat.listForUser(req.user.id))
  } catch {
    res.status(500).json({ message: 'No fue posible cargar las conversaciones' })
  }
}

const getConversation = async (req, res) => {
  const conversationId = parseId(req.params.id)
  if (!conversationId) return res.status(400).json({ message: 'ID de conversación inválido' })
  const conversation = await Chat.isParticipant(conversationId, req.user.id)
  if (!conversation) return res.status(404).json({ message: 'Conversación no encontrada' })
  return conversation
}

const listMessages = async (req, res) => {
  try {
    const conversation = await getConversation(req, res)
    if (!conversation) return
    await Chat.markRead(conversation.id, req.user.id)
    res.json(await Chat.listMessages(conversation.id))
  } catch {
    res.status(500).json({ message: 'No fue posible cargar los mensajes' })
  }
}

const sendMessage = async (req, res) => {
  try {
    const conversation = await getConversation(req, res)
    if (!conversation) return
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : ''
    if (!content) return res.status(400).json({ message: 'El mensaje no puede estar vacío' })
    const message = await Chat.createMessage({ conversationId: conversation.id, senderId: req.user.id, content })
    res.status(201).json(message)
  } catch {
    res.status(500).json({ message: 'No fue posible enviar el mensaje' })
  }
}

const sendMedia = async (req, res) => {
  try {
    const conversation = await getConversation(req, res)
    if (!conversation) return
    if (!req.file) return res.status(400).json({ message: "No se recibió ningún archivo en el campo 'attachment'" })
    const type = String(req.body.type || 'archivo')
    if (!allowedTypes.has(type) || type === 'texto') return res.status(400).json({ message: 'Tipo de adjunto inválido' })
    const message = await Chat.createMessage({
      conversationId: conversation.id,
      senderId: req.user.id,
      content: typeof req.body.content === 'string' ? req.body.content.trim() : '',
      type,
      file: { url: `/uploads/${req.file.filename}`, name: req.file.originalname, mime: req.file.mimetype }
    })
    res.status(201).json(message)
  } catch {
    res.status(500).json({ message: 'No fue posible enviar el adjunto' })
  }
}

module.exports = { createConversation, listConversations, listMessages, sendMessage, sendMedia }
