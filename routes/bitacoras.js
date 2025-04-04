const express = require("express")
const router = express.Router()
const bitacorasController = require("../controllers/bitacorasController")
const { verificarAutenticacion, verificarRol } = require("../middlewares/auth")

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarAutenticacion)

// Ruta principal - mostrar todas las bitácoras
router.get("/", verificarRol(["admin"]), bitacorasController.mostrarBitacoras)

// Bitácoras de reparaciones
router.get("/reparaciones", verificarRol(["admin", "tecnico"]), bitacorasController.bitacorasReparaciones)

// Listar técnicos con estadísticas
router.get("/tecnicos", verificarRol(["admin"]), bitacorasController.listarTecnicos)

// Ver bitácoras de un técnico específico
router.get("/tecnicos/:id", verificarRol(["admin"]), bitacorasController.bitacorasPorTecnico)

// Listar equipos con estadísticas
router.get("/equipos", verificarRol(["admin", "tecnico"]), bitacorasController.listarEquipos)

// Ver bitácoras de un equipo específico
router.get("/equipos/:id", verificarRol(["admin", "tecnico"]), bitacorasController.bitacorasPorEquipo)

// Generar reporte PDF
router.get("/reporte", verificarRol(["admin"]), bitacorasController.generarReportePDF)

module.exports = router

