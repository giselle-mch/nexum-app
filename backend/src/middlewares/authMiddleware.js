const { admin, db } = require('../config/firebase')

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ message: 'Token no proporcionado' })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' })
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    const userDoc = await db.collection('users').doc(decoded.uid).get()

    if (!userDoc.exists) {
      return res.status(401).json({ message: 'Usuario no autorizado' })
    }

    const user = userDoc.data()
    req.user = {
      uid: decoded.uid,
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      telefono: user.telefono || null,
      rol: user.rol,
    }

    next()
  } catch (error) {
    console.error('Error verificando token Firebase:', error)
    return res.status(401).json({ message: 'Token inválido' })
  }
}

module.exports = verifyToken