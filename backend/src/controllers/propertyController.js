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

const normalizeLocationFields = (data, { requireCoordinates = false } = {}) => {
  const normalized = { ...data }
  const hasLatitude = data.latitud !== undefined
  const hasLongitude = data.longitud !== undefined

  if (requireCoordinates || hasLatitude || hasLongitude) {
    const latitude = Number(data.latitud)
    const longitude = Number(data.longitud)
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return { error: 'Selecciona una ubicación válida en el mapa' }
    }
    normalized.latitud = latitude
    normalized.longitud = longitude
  }

  if (data.codigo_postal !== undefined) {
    const postalCode = String(data.codigo_postal).trim()
    if (postalCode && !/^\d{5}$/.test(postalCode)) {
      return { error: 'El código postal debe contener 5 dígitos' }
    }
    normalized.codigo_postal = postalCode || null
  }

  return { data: normalized }
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
      neighborhood: property.colonia,
      postalCode: property.codigo_postal,
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

    const location = normalizeLocationFields(req.body, { requireCoordinates: true })
    if (location.error) return res.status(400).json({ message: location.error })

    const propertyData = {
      ...location.data,
      propietario_id: req.user.id
    }

    const property = await Property.create(propertyData)
    const fullProperty = await Property.findById(property.id)

    res.status(201).json(toMobileDetail(fullProperty))

  } catch (error) {

    console.error("Error en createProperty:", error)
    res.status(500).json({
      message: "Error creando inmueble"
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
      message: "Error obteniendo inmuebles"
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
      message: "Error obteniendo inmueble"
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
      message: "Error obteniendo propiedades para mapa"
    })

  }
}

const searchProperties = async (req, res) => {

  try {

    const filters = {
      ubicacion: req.query.ubicacion,
      ciudad: req.query.ciudad,
      colonia: req.query.colonia,
      codigo_postal: req.query.codigo_postal,
      tipo: req.query.tipo,
      precio_min: req.query.precio_min,
      precio_max: req.query.precio_max
    }

    const properties = await Property.search(filters)

    res.json(properties.map(toMobileListItem))

  } catch (error) {

    console.error("Error en searchProperties:", error)

    res.status(500).json({
      message: "Error buscando inmuebles"
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
      message: "Error buscando propiedades cercanas"
    })

  }
}

const getMyProperties = async (req, res) => {

 try {

  const userId = req.user.id;

 const properties = await Property.getPropertiesByUser(userId);

  res.json(properties.map(toMobileListItem));

 } catch (error) {

  console.error("Error en getMyProperties:", error)

  res.status(500).json({
   message: "Error obteniendo propiedades del usuario"
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

    const location = normalizeLocationFields(req.body)
    if (location.error) return res.status(400).json({ message: location.error })

    const updated = await Property.updateByIdAndOwner(propertyId, ownerId, location.data)

    if (!updated) {
      return res.status(404).json({ message: 'Propiedad no encontrada o sin cambios' })
    }

    const fullProperty = await Property.findById(propertyId)

    res.json(toMobileDetail(fullProperty))

  } catch (error) {

    console.error("Error en updateMyProperty:", error)
    res.status(500).json({
      message: "Error actualizando inmueble"
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
      message: "Error eliminando inmueble"
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
