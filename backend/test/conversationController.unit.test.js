jest.mock('../src/models/conversationModel', () => ({
  createForProperty: jest.fn(),
  findForUser: jest.fn(),
  findParticipant: jest.fn(),
  getMessages: jest.fn(),
  addMessage: jest.fn()
}))

const Conversation = require('../src/models/conversationModel')
const controller = require('../src/controllers/conversationController')

const response = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
})

describe('Controlador de conversaciones', () => {
  test('rechaza leer una conversación ajena', async () => {
    Conversation.findParticipant.mockResolvedValueOnce(undefined)
    const res = response()
    await controller.getConversation({ params: { id: '8' }, user: { id: 2 } }, res)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(Conversation.getMessages).not.toHaveBeenCalled()
  })

  test('rechaza mensajes vacíos antes de consultar la base', async () => {
    const res = response()
    await controller.sendMessage({ params: { id: '8' }, body: { content: '  ' }, user: { id: 2 } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(Conversation.addMessage).not.toHaveBeenCalled()
  })

  test('devuelve solo conversaciones del usuario autenticado', async () => {
    Conversation.findForUser.mockResolvedValueOnce([])
    const res = response()
    await controller.listConversations({ user: { id: 17 } }, res)
    expect(Conversation.findForUser).toHaveBeenCalledWith(17)
    expect(res.json).toHaveBeenCalledWith([])
  })
})
