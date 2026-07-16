jest.mock('../src/models/propertyModel', () => ({
  findAll: jest.fn()
}))

const Property = require('../src/models/propertyModel')
const { getProperties } = require('../src/controllers/propertyController')

describe('Respuestas de errores internos', () => {
  test('no expone detalles internos de la base de datos', async () => {
    const internalMessage = 'password authentication failed for postgres at 10.0.0.1'
    Property.findAll.mockRejectedValueOnce(new Error(internalMessage))

    const req = {}
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    await getProperties(req, res)

    expect(consoleSpy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Error obteniendo inmuebles' })
    expect(JSON.stringify(res.json.mock.calls)).not.toContain(internalMessage)
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('error')

    consoleSpy.mockRestore()
  })
})
