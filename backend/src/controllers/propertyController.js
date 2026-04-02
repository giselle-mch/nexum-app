const Property = require('../models/propertyModel')

const createProperty = async (req, res) => {

  try {

    const propertyData = {
      ...req.body,
      propietario_id: req.user.id
    }

    const property = await Property.create(propertyData)

    res.status(201).json(property)

  } catch (error) {

    console.error("Error en createProperty:", error)
    res.status(500).json({
      message: "Error creando inmueble",
      error
    })

  }

}

const getProperties = async (req, res) => {

  try {

    const properties = await Property.findAll()

    res.json(properties)

  } catch (error) {

    console.error("Error en getProperties:", error)

    res.status(500).json({
      message: "Error obteniendo inmuebles",
      error: error.message
    })

  }

}

const getPropertyById = async (req, res) => {

  try {

    const property = await Property.findById(req.params.id)

    res.json(property)

  } catch (error) {

    console.error("Error en getPropertyById:", error)

    res.status(500).json({
      message: "Error obteniendo inmueble",
      error: error.message
    })

  }

}

const searchProperties = async (req, res) => {

  try {

    const filters = {
      ciudad: req.query.ciudad,
      tipo: req.query.tipo,
      precio_min: req.query.precio_min,
      precio_max: req.query.precio_max
    }

    const properties = await Property.search(filters)

    res.json(properties)

  } catch (error) {

    console.error("Error en searchProperties:", error)

    res.status(500).json({
      message: "Error buscando inmuebles",
      error: error.message
    })

  }

}

const getNearbyProperties = async (req, res) => {

  try {

    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    const radius = Number(req.query.radius)

    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(radius)) {
      return res.status(400).json({
        message: "Parámetros inválidos. Usa lat, lng y radius numéricos"
      })
    }

    const properties = await Property.findNearby({ lat, lng, radius })

    res.json(properties)

  } catch (error) {

    console.error("Error en getNearbyProperties:", error)

    res.status(500).json({
      message: "Error buscando propiedades cercanas",
      error: error.message
    })

  }
}

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  searchProperties,
  getNearbyProperties
}
