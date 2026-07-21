const DB_CLIENT_ROLE = 'usuario'

const normalizeIncomingRole = (role) => {
  if (role === 'arrendador') return 'arrendador'
  return DB_CLIENT_ROLE
}

const toPublicRole = (dbRole) => {
  if (dbRole === DB_CLIENT_ROLE) return 'cliente'
  return dbRole
}

const sanitizeUser = (user) => ({
  id: user.id,
  nombre: user.nombre,
  email: user.email,
  telefono: user.telefono,
  rol: toPublicRole(user.rol)
})

const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Usuario no autenticado'
      })
    }

    const user = {
      id: req.user.id,
      nombre: req.user.nombre,
      email: req.user.email,
      telefono: req.user.telefono,
      rol: req.user.rol
    }

    if (!user.id || !user.email) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      })
    }

    res.json({
      message: 'Perfil de usuario',
      user: sanitizeUser(user)
    })
  } catch (error) {
    console.error('Error en getUserProfile:', error)

    res.status(500).json({
      message: 'Error al obtener perfil'
    })
  }
}

module.exports = {
  getUserProfile,
  normalizeIncomingRole,
  toPublicRole,
  sanitizeUser
}
