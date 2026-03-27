const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

// Ruta de prueba
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Nexum API funcionando'
  })
})

const pool = require('./config/database')

app.get('/db-test', async (req, res) => {

  const result = await pool.query('SELECT NOW()')

  res.json({
    database_time: result.rows[0]
  })

})

module.exports = app