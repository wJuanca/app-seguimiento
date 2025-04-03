const express = require("express")
const router = express.Router()
const reporteController = require("../controllers/reporteController")

// Ruta principal de reportes
router.get("/", (req, res) => {
  res.render("reports/index", { title: "Reportes del Sistema" })
})

// ruta para inventario
router.get("/reporte_inventario", (req, res) => {
  if (typeof reporteController.mostrarReporteInventario === "function") {
    reporteController.mostrarReporteInventario(req, res)
  } else {
    res.render("reports/reporte_inventario", { title: "Inventario" })
  }
})

// ruta para asignaciones
router.get("/reporte_asignaciones", (req, res) => {
  if (typeof reporteController.mostrarReporteAsignaciones === "function") {
    reporteController.mostrarReporteAsignaciones(req, res)
  } else {
    res.render("reports/reporte_asignaciones", { title: "Asignaciones" })
  }
})

// ruta para mantenimiento
router.get("/reporte_mantenimiento", (req, res) => {
  if (typeof reporteController.mostrarReporteMantenimiento === "function") {
    reporteController.mostrarReporteMantenimiento(req, res)
  } else {
    res.render("reports/reporte_mantenimiento", { title: "Mantenimiento" })
  }
})

// ruta para solicitudes
router.get("/reporte_solicitudes", (req, res) => {
  if (typeof reporteController.mostrarReporteSolicitudes === "function") {
    reporteController.mostrarReporteSolicitudes(req, res)
  } else {
    res.render("reports/reporte_solicitudes", { title: "Solicitudes" })
  }
})

// ruta para usuarios
router.get("/reporte_usuarios", (req, res) => {
  res.render("reports/reporte_usuarios", { title: "Usuarios" })
})

// ruta para detalles
router.get("/detalles_procesos", (req, res) => {
  res.render("reports/detalles_procesos", { title: "Detalles de Procesos" })
})

module.exports = router

