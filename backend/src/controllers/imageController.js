const Image = require('../models/imageModel')

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se recibió ningún archivo. Revisa que el campo se llame 'image'" });
    }

    const property_id = req.params.id;
    const image_url = `/uploads/${req.file.filename}`;

    console.log("Intentando guardar en DB:", { property_id, image_url });

    const image = await Image.add(property_id, image_url);

    res.json(image);
  } catch (error) {

    console.error("Error detallado:", error); 
    
    res.status(500).json({
      message: "Error subiendo imagen",
      error: error.message
    });
  }
};

module.exports = {
  uploadImage
}