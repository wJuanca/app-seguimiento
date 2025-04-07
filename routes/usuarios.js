const express = require("express")
const router = express.Router()
const conexion = require("../database/db")
const usuariosController = require("../controllers/usuarios")
const auth = require("../middlewares/auth")


// Ruta principal - lista de usuarios
router.get("/", (req, res) => {
  conexion.query("SELECT * FROM usuarios", (error, resultado) => {
    if (error) {
      console.log(error)
      return
    }
    res.render("usuarios/index", { usuarios: resultado })
  })
})

// Ruta para mostrar el formulario de crear usuario
router.get("/crear", (req, res) => {
  res.render("usuarios/crear")
})

// Ruta para guardar un nuevo usuario
router.post("/save", usuariosController.save)

// Ruta para mostrar el formulario de editar usuario
router.get("/editar/:id", (req, res) => {
  const id_usuario = req.params.id
  conexion.query("SELECT * FROM usuarios WHERE id_usuario = ?", [id_usuario], (error, resultado) => {
    if (error) {
      console.log(error)
      return
    }
    res.render("usuarios/editar", { usuarios: resultado[0] })
  })
})

// Ruta para actualizar usuario
router.post("/edit", usuariosController.edit)

// Ruta para mostrar detalles de usuario
router.get("/ver/:id", (req, res) => {
  const id_usuario = req.params.id
  conexion.query("SELECT * FROM usuarios WHERE id_usuario = ?", [id_usuario], (error, resultado) => {
    if (error) {
      console.log(error)
      return
    }
    res.render("usuarios/ver", { usuarios: resultado[0] })
  })
})

// Ruta para mostrar el formulario de eliminar usuario
router.get("/eliminar/:id", (req, res) => {
  const id_usuario = req.params.id
  conexion.query("SELECT * FROM usuarios WHERE id_usuario = ?", [id_usuario], (error, resultado) => {
    if (error) {
      console.log(error)
      return
    }
    res.render("usuarios/eliminar", { usuarios: resultado[0] })
  })
})

// Ruta para eliminar usuario
router.post("/eliminar", usuariosController.eliminar)

module.exports = router

