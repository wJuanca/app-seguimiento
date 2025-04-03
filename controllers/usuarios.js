const conexion = require("../database/db")

exports.save = (req, res) => {
  const nombre = req.body.nombre
  const correo = req.body.correo
  const telefono = req.body.telefono
  const contrasena = req.body.contrasena
  const rol = req.body.rol
  const fecha_registro = req.body.fecha_registro

  conexion.query(
    "INSERT INTO usuarios SET ?",
    {
      nombre: nombre,
      correo: correo,
      telefono: telefono,
      contrasena: contrasena,
      rol: rol,
      fecha_registro: fecha_registro,
    },
    (error, resultado) => {
      if (error) {
        console.log(error)
      } else {
        res.redirect("/usuarios")
      }
    },
  )
}

exports.edit = (req, res) => {
  const id_usuario = req.body.id_usuario
  const nombre = req.body.nombre
  const correo = req.body.correo
  const telefono = req.body.telefono
  const contrasena = req.body.contrasena
  const rol = req.body.rol
  const fecha_registro = req.body.fecha_registro

  conexion.query(
    "UPDATE usuarios SET ? WHERE id_usuario = ?",
    [
      {
        id_usuario: id_usuario,
        nombre: nombre,
        correo: correo,
        telefono: telefono,
        contrasena: contrasena,
        rol: rol,
        fecha_registro: fecha_registro,
      },
      id_usuario,
    ],
    (error, resultado) => {
      if (error) {
        console.log(error)
      } else {
        res.redirect("/usuarios")
      }
    },
  )
}

exports.eliminar = (req, res) => {
  const id_usuario = req.body.id_usuario

  conexion.query("DELETE FROM usuarios WHERE id_usuario = ?", [id_usuario], (error, resultado) => {
    if (error) {
      console.log(error)
      res.status(500).send("Error al eliminar el usuario")
    } else {
      res.redirect("/usuarios")
    }
  })
}

