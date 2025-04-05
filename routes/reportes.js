const express = require("express")
const router = express.Router()
const reporteController = require("../controllers/reporteController")

// Ruta principal de reportes
router.get("/", (req, res) => {
  res.render("reports/index", {
    title: "Reportes del Sistema",
    currentPath: "/reportes",
  })
})

// ruta para inventario
router.get("/reporte_inventario", (req, res) => {
  if (typeof reporteController.mostrarReporteInventario === "function") {
    req.currentPath = "/reportes/reporte_inventario"
    reporteController.mostrarReporteInventario(req, res)
  } else {
    res.render("reports/reporte_inventario", {
      title: "Inventario",
      currentPath: "/reportes/reporte_inventario",
    })
  }
})

// ruta para asignaciones
router.get("/reporte_asignaciones", (req, res) => {
  if (typeof reporteController.mostrarReporteAsignaciones === "function") {
    req.currentPath = "/reportes/reporte_asignaciones"
    reporteController.mostrarReporteAsignaciones(req, res)
  } else {
    res.render("reports/reporte_asignaciones", {
      title: "Asignaciones",
      currentPath: "/reportes/reporte_asignaciones",
    })
  }
})

// ruta para mantenimiento
router.get("/reporte_mantenimiento", (req, res) => {
  if (typeof reporteController.mostrarReporteMantenimiento === "function") {
    req.currentPath = "/reportes/reporte_mantenimiento"
    reporteController.mostrarReporteMantenimiento(req, res)
  } else {
    res.render("reports/reporte_mantenimiento", {
      title: "Mantenimiento",
      currentPath: "/reportes/reporte_mantenimiento",
    })
  }
})

// ruta para usuarios
router.get("/reporte_usuarios", (req, res) => {
  res.render("reports/reporte_usuarios", {
    title: "Usuarios",
    currentPath: "/reportes/reporte_usuarios",
  })
})

// ruta para detalles
router.get("/detalles_procesos", (req, res) => {
  res.render("reports/detalles_procesos", {
    title: "Detalles de Procesos",
    currentPath: "/reportes/detalles_procesos",
  })
})

module.exports = router

