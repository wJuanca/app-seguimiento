const express = require("express")
const router = express.Router()
const reparacionController = require("../controllers/reparacionController")
const conexion = require("../database/db")

// Ruta principal - mostrar todas las reparaciones
router.get("/", reparacionController.mostrarReparaciones)

// Filtrar reparaciones por estado
router.get("/estado", reparacionController.getReparacionesPorEstado)

// Ver detalles de una reparación
router.get("/detalles/:id", reparacionController.verDetallesReparacion)

// Formulario para crear una nueva reparación
router.get("/crear", reparacionController.cargarFormularioCrear)
router.post("/crear", reparacionController.saveReparacion)

// Asignar técnico a una reparacion (para administradores)
router.post("/asignar-tecnico/:id", reparacionController.asignarTecnico)

// Tomar caso (para tecnicos)
router.post("/tomar-caso/:id", reparacionController.tomarCaso)

// Completar reparacion
router.post("/completar/:id", reparacionController.completarReparacion)

// Descartar reparacion
router.post("/descartar/:id", reparacionController.descartarReparacion)

// Editar reparacion
router.get("/editar/:id", (req, res) => {
  const id_reparacion = req.params.id
  conexion.query("select * from reparaciones where id_reparacion = ?", [id_reparacion], (error, resultado) => {
    if (error) {
      console.log(error)
      return
    } else {
      const estados = ["pendiente", "en_proceso", "reparado", "descartado"]
      res.render("reparaciones/editar", { reparacion: resultado[0], estados: estados })
    }
  })
})
router.post("/editar", reparacionController.updateReparacion)

// Eliminar reparacion
router.get("/eliminar/:id", (req, res) => {
  const id_reparacion = req.params.id
  conexion.query("select * from reparaciones where id_reparacion = ?", [id_reparacion], (error, resultado) => {
    if (error) {
      console.log(error)
      return
    } else {
      res.render("reparaciones/eliminar", { reparacion: resultado[0] })
    }
  })
})
router.post("/eliminar", reparacionController.deleteReparacion)

// Ver reparacion
router.get("/ver/:id", reparacionController.viewReparacion)

module.exports = router

