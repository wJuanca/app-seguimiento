const conexion = require("../database/db")

// Mostrar equipos asignados al usuario actual
exports.mostrarMisEquipos = (req, res) => {
  const idUsuario = req.session.usuario.id

  // Consulta para obtener los equipos asignados al usuario
  const sql = `
    SELECT e.*, r.estado AS estado_reparacion, r.descripcion, r.fecha_inicio, r.fecha_fin
    FROM equipos e
    LEFT JOIN reparaciones r ON e.id_equipo = r.id_equipo AND r.estado != 'completada'
    WHERE e.usuario_actual_id = ?
  `

  conexion.query(sql, [idUsuario], (error, equipos) => {
    if (error) {
      console.error("Error al obtener equipos del usuario:", error)
      req.flash("error", "Error al cargar tus equipos")
      return res.redirect("/")
    }

    res.render("mi-equipo/index", { equipos })
  })
}

// Ver detalles de un equipo específico
exports.verDetallesEquipo = (req, res) => {
  const idEquipo = req.params.id
  const idUsuario = req.session.usuario.id

  // Verificar que el equipo pertenezca al usuario
  conexion.query(
    "SELECT * FROM equipos WHERE id_equipo = ? AND usuario_actual_id = ?",
    [idEquipo, idUsuario],
    (error, resultados) => {
      if (error) {
        console.error("Error al obtener detalles del equipo:", error)
        req.flash("error", "Error al cargar los detalles del equipo")
        return res.redirect("/mi-equipo")
      }

      if (resultados.length === 0) {
        req.flash("error", "No tienes acceso a este equipo")
        return res.redirect("/mi-equipo")
      }

      const equipo = resultados[0]

      // Obtener historial de reparaciones
      conexion.query(
        "SELECT * FROM reparaciones WHERE id_equipo = ? ORDER BY fecha_inicio DESC",
        [idEquipo],
        (error, reparaciones) => {
          if (error) {
            console.error("Error al obtener historial de reparaciones:", error)
            req.flash("error", "Error al cargar el historial de reparaciones")
            return res.redirect("/mi-equipo")
          }

          res.render("mi-equipo/detalles", { equipo, reparaciones })
        },
      )
    },
  )
}

