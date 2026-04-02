const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const propertyRoutes = require('./routes/propertyRoutes')
const imageRoutes = require('./routes/imageRoutes')
const favoriteRoutes = require('./routes/favoriteRoutes');

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/images', imageRoutes)
app.use('/uploads', express.static('uploads'))
app.use('/api/favorites', favoriteRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

module.exports = app