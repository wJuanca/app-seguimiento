const mysql = require("mysql2")

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1508",
  database: "GestionEquipos",
})

// Conectar a la base de datos
connection.connect((err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err)
    return
  }
  console.log("Conexión exitosa a la base de datos.")
})

module.exports = connection
// Agregar esta linea para exportar la version con promesas
module.exports.promise = connection.promise()

