const Property = require('../models/propertyModel')

const normalizeImages = (imagenes) => {
  if (Array.isArray(imagenes)) {
    return imagenes.filter(Boolean)
  }

  if (typeof imagenes === 'string') {
    try {
      const parsed = JSON.parse(imagenes)
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean)
      }
    } catch (error) {
      return []
    }
  }

  return []
}

const parseOptionalNumber = (value) => {
  if (value === undefined) return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const toMobileListItem = (property) => {
  const images = normalizeImages(property.imagenes)

  return {
    id: property.id,
    title: property.titulo,
    price: property.precio !== null ? Number(property.precio) : null,
    type: property.tipo,
    city: property.ciudad,
    thumbnail: images[0] || null,
    imagesCount: images.length,
    location: {
      lat: property.latitud !== null ? Number(property.latitud) : null,
      lng: property.longitud !== null ? Number(property.longitud) : null
    },
    distanceKm: property.distancia_km !== undefined && property.distancia_km !== null
      ? Number(property.distancia_km)
      : undefined
  }
}

const toMapMarker = (property) => {
  return {
    id: property.id,
    titulo: property.titulo,
    precio: property.precio !== null ? Number(property.precio) : null,
    latitud: property.latitud !== null ? Number(property.latitud) : null,
    longitud: property.longitud !== null ? Number(property.longitud) : null,
    imagen_principal: property.imagen_principal || null
  }
}

const toMobileDetail = (property) => {
  const images = normalizeImages(property.imagenes)

  return {
    id: property.id,
    title: property.titulo,
    description: property.descripcion,
    price: property.precio !== null ? Number(property.precio) : null,
    type: property.tipo,
    phone: property.telefono_contacto,
    images,
    location: {
      address: property.direccion,
      city: property.ciudad,
      lat: property.latitud !== null ? Number(property.latitud) : null,
      lng: property.longitud !== null ? Number(property.longitud) : null
    },
    owner: {
      id: property.arrendador_id ?? property.propietario_id,
      name: property.arrendador_nombre || null
    },
    createdAt: property.creado_en,
    distanceKm: property.distancia_km !== undefined && property.distancia_km !== null
      ? Number(property.distancia_km)
      : undefined
  }
}

const createProperty = async (req, res) => {

  try {

    const propertyData = {
      ...req.body,
      propietario_id: req.user.id
    }

    const property = await Property.create(propertyData)
    const fullProperty = await Property.findById(property.id)

    res.status(201).json(toMobileDetail(fullProperty))

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

    res.json(properties.map(toMobileListItem))

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

    if (!property) {
      return res.status(404).json({ message: "Propiedad no encontrada" })
    }

    res.json(toMobileDetail(property))

  } catch (error) {

    console.error("Error en getPropertyById:", error)

    res.status(500).json({
      message: "Error obteniendo inmueble",
      error: error.message
    })

  }

}

const getPropertyDetail = async (req, res) => {
  return getPropertyById(req, res)
}

const getMapProperties = async (req, res) => {

  try {

    const minLat = parseOptionalNumber(req.query.minLat)
    const maxLat = parseOptionalNumber(req.query.maxLat)
    const minLng = parseOptionalNumber(req.query.minLng)
    const maxLng = parseOptionalNumber(req.query.maxLng)
    const limit = parseOptionalNumber(req.query.limit)

    if ([minLat, maxLat, minLng, maxLng, limit].includes(null)) {
      return res.status(400).json({
        message: "Parámetros inválidos. Usa minLat, maxLat, minLng, maxLng y limit numéricos"
      })
    }

    const properties = await Property.findForMap({
      minLat,
      maxLat,
      minLng,
      maxLng,
      limit
    })

    res.json(properties.map(toMapMarker))

  } catch (error) {

    console.error("Error en getMapProperties:", error)

    res.status(500).json({
      message: "Error obteniendo propiedades para mapa",
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

    res.json(properties.map(toMobileListItem))

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

    res.json(properties.map(toMobileListItem))

  } catch (error) {

    console.error("Error en getNearbyProperties:", error)

    res.status(500).json({
      message: "Error buscando propiedades cercanas",
      error: error.message
    })

  }
}

const getMyProperties = async (req, res) => {

 try {

  const userId = req.user.id;

 const properties = await Property.getPropertiesByUser(userId);

  res.json(properties.map(toMobileListItem));

 } catch (error) {

  res.status(500).json({
   error: "Error obteniendo propiedades del usuario"
  });

 }

};

const updateMyProperty = async (req, res) => {

  try {

    const propertyId = Number(req.params.id)
    if (Number.isNaN(propertyId)) {
      return res.status(400).json({ message: 'ID inválido' })
    }

    const ownerId = req.user.id

    const updated = await Property.updateByIdAndOwner(propertyId, ownerId, req.body)

    if (!updated) {
      return res.status(404).json({ message: 'Propiedad no encontrada o sin cambios' })
    }

    const fullProperty = await Property.findById(propertyId)

    res.json(toMobileDetail(fullProperty))

  } catch (error) {

    console.error("Error en updateMyProperty:", error)
    res.status(500).json({
      message: "Error actualizando inmueble",
      error: error.message
    })

  }

}

const deleteMyProperty = async (req, res) => {

  try {

    const propertyId = Number(req.params.id)
    if (Number.isNaN(propertyId)) {
      return res.status(400).json({ message: 'ID inválido' })
    }

    const ownerId = req.user.id

    const deleted = await Property.deleteByIdAndOwner(propertyId, ownerId)

    if (!deleted) {
      return res.status(404).json({ message: 'Propiedad no encontrada' })
    }

    res.json({ message: 'Propiedad eliminada', propertyId: deleted.id })

  } catch (error) {

    console.error("Error en deleteMyProperty:", error)
    res.status(500).json({
      message: "Error eliminando inmueble",
      error: error.message
    })

  }

}

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  getPropertyDetail,
  getMapProperties,
  searchProperties,
  getNearbyProperties,
  getMyProperties,
  updateMyProperty,
  deleteMyProperty
}
