require('dotenv').config()
const app = require('./src/app')
const pool = require('./src/config/database')

const PORT = process.env.PORT || 3000

pool.connect()
  .then(() => {
    console.log("Conectado a PostgreSQL")

    app.listen(PORT, () => {
      console.log(`Servidor Nexum corriendo en puerto ${PORT}`)
    })
  })
  .catch(err => {
    console.error("Error conectando a la base de datos", err)
  })