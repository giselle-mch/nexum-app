const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')

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

const register = async (req, res) => {

  try {

    const { nombre, email, password, telefono, rol } = req.body

    const existingUser = await User.findByEmail(email)

    if (existingUser) {
      return res.status(400).json({
        message: "El usuario ya existe"
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await User.create({
      nombre,
      email,
      password: hashedPassword,
      telefono,
      rol: normalizeIncomingRole(rol)
    })

    res.status(201).json({
      message: "Usuario creado",
      user: sanitizeUser(newUser)
    })

  } catch (error) {

    res.status(500).json({
      message: "Error en registro",
      error
    })

  }

}

const login = async (req, res) => {

  try {

    const { email, password } = req.body

    const user = await User.findByEmail(email)

    if (!user) {
      return res.status(400).json({
        message: "Usuario no encontrado"
      })
    }

    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return res.status(400).json({
        message: "Contraseña incorrecta"
      })
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: toPublicRole(user.rol)
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    )

    res.json({
      message: "Login exitoso",
      token,
      user: sanitizeUser(user)
    })

  } catch (error) {

    res.status(500).json({
      message: "Error en login",
      error
    })

  }

}

const recoverPassword = async (req, res) => {

  try {

    const { email, newPassword } = req.body

    if (!email || !newPassword) {
      return res.status(400).json({
        message: "Email y nueva contraseña son requeridos"
      })
    }

    const existingUser = await User.findByEmail(email)

    if (!existingUser) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await User.updatePasswordByEmail(email, hashedPassword)

    res.json({
      message: "Contraseña actualizada correctamente"
    })

  } catch (error) {

    res.status(500).json({
      message: "Error recuperando contraseña",
      error
    })

  }

}

module.exports = {
  register,
  login,
  recoverPassword
}
