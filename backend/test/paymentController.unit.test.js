jest.mock('../src/models/paymentModel', () => ({
  create: jest.fn(),
  findForUser: jest.fn(),
  markPaid: jest.fn(),
  cancel: jest.fn()
}))

const Payment = require('../src/models/paymentModel')
const controller = require('../src/controllers/paymentController')

const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() })

describe('Controlador de pagos simulados', () => {
  test('lista únicamente los pagos del usuario autenticado', async () => {
    Payment.findForUser.mockResolvedValueOnce([])
    const res = response()
    await controller.listPayments({ user: { id: 7 } }, res)
    expect(Payment.findForUser).toHaveBeenCalledWith(7)
    expect(res.json).toHaveBeenCalledWith([])
  })

  test('rechaza monto y fecha inválidos', async () => {
    const res = response()
    await controller.createPayment({ body: { conversationId: 2, amount: -1, dueDate: 'mañana' }, user: { id: 3 } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(Payment.create).not.toHaveBeenCalled()
  })

  test('no permite simular un pago ajeno o no pendiente', async () => {
    Payment.markPaid.mockResolvedValueOnce(undefined)
    const res = response()
    await controller.simulatePayment({ params: { id: '4' }, user: { id: 99 } }, res)
    expect(Payment.markPaid).toHaveBeenCalledWith(4, 99)
    expect(res.status).toHaveBeenCalledWith(409)
  })

  test('no permite cancelar un cobro ajeno', async () => {
    Payment.cancel.mockResolvedValueOnce(undefined)
    const res = response()
    await controller.cancelPayment({ params: { id: '4' }, user: { id: 99 } }, res)
    expect(Payment.cancel).toHaveBeenCalledWith(4, 99)
    expect(res.status).toHaveBeenCalledWith(409)
  })
})
