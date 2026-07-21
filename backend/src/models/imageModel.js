const { db } = require('../config/firebase')

const Image = {
  async add(propertyId, imageUrl) {
    const propertyRef = db.collection('properties').doc(String(propertyId))

    const result = await db.runTransaction(async (transaction) => {
      const propertyDoc = await transaction.get(propertyRef)
      if (!propertyDoc.exists) {
        throw new Error('PROPERTY_NOT_FOUND')
      }

      const propertyData = propertyDoc.data() || {}
      const currentImages = Array.isArray(propertyData.imagenes)
        ? propertyData.imagenes.filter(Boolean)
        : []

      if (!currentImages.includes(imageUrl)) {
        currentImages.push(imageUrl)
      }

      transaction.update(propertyRef, {
        imagenes: currentImages,
        updatedAt: new Date().toISOString(),
      })

      return {
        property_id: Number(propertyId),
        image_url: imageUrl,
      }
    })

    return result
  },

  async findByProperty(propertyId) {
    const propertyDoc = await db.collection('properties').doc(String(propertyId)).get()
    if (!propertyDoc.exists) {
      return []
    }

    const data = propertyDoc.data() || {}
    const images = Array.isArray(data.imagenes) ? data.imagenes : []

    return images.filter(Boolean).map((imageUrl) => ({
      property_id: Number(propertyId),
      image_url: imageUrl,
    }))
  },
}

module.exports = Image
