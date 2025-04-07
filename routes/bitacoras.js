const express = require("express")
const router = express.Router()
const bitacorasController = require("../controllers/bitacorasController")
const { verificarAutenticacion, verificarRol } = require("../middlewares/auth")

// Aplicar middleware de autenticacion a todas las rutas
router.use(verificarAutenticacion)

// Ruta principal - mostrar todas las bitácoras
router.get("/", verificarRol(["admin"]), bitacorasController.mostrarBitacoras)

// Bitacoras de reparaciones
router.get("/reparaciones", verificarRol(["admin", "tecnico"]), bitacorasController.bitacorasReparaciones)

// Listar tecnicos con estadisticas
router.get("/tecnicos", verificarRol(["admin"]), bitacorasController.listarTecnicos)

// Ver bitacoras de un tecnico especifico
router.get("/tecnicos/:id", verificarRol(["admin"]), bitacorasController.bitacorasPorTecnico)

// Listar equipos con estadísticas
router.get("/equipos", verificarRol(["admin", "tecnico"]), bitacorasController.listarEquipos)

// Ver bitacoras de un equipo especifico
router.get("/equipos/:id", verificarRol(["admin", "tecnico"]), bitacorasController.bitacorasPorEquipo)

// Generar reporte PDF
router.get("/reporte", verificarRol(["admin"]), bitacorasController.generarReportePDF)

module.exports = router

