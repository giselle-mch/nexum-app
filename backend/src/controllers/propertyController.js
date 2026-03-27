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

    res.status(500).json({
      message: "Error obteniendo inmuebles"
    })

  }

}

const getPropertyById = async (req, res) => {

  try {

    const property = await Property.findById(req.params.id)

    res.json(property)

  } catch (error) {

    res.status(500).json({
      message: "Error obteniendo inmueble"
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

    res.status(500).json({
      message: "Error buscando inmuebles"
    })

  }

}

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  searchProperties
}