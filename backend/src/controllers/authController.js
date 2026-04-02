const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')

const register = async (req, res) => {

  try {

    const { nombre, email, password, telefono } = req.body

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
      rol: "usuario"
    })

    res.status(201).json({
      message: "Usuario creado",
      user: newUser
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
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    )

    res.json({
      message: "Login exitoso",
      token
    })

  } catch (error) {

    res.status(500).json({
      message: "Error en login",
      error
    })

  }

}

module.exports = {
  register,
  login
}