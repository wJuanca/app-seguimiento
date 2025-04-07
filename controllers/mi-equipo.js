const conexion = require("../database/db")

// Mostrar equipos asignados al usuario actual
exports.mostrarMisEquipos = (req, res) => {
  const idUsuario = req.session.usuario.id

  // Consulta para obtener los equipos que fueron asignados al usuario con información de reparaciones y fecha de asignación
  const sql = `
    SELECT e.*, 
         r.id_reparacion, r.estado AS estado_reparacion, r.descripcion_problema, 
         r.fecha_inicio, r.fecha_finalizacion,
         t.nombre AS nombre_tecnico, t.telefono AS telefono_tecnico,
         a.fecha_asignacion, a.razon_asignacion
    FROM equipos e
    LEFT JOIN reparaciones r ON e.id_equipo = r.equipo_id AND r.estado != 'reparado'
    LEFT JOIN usuarios t ON r.tecnico_id = t.id_usuario
    LEFT JOIN asignaciones a ON e.id_equipo = a.equipo_id AND a.usuario_id = ? AND a.estado = 'activa'
    WHERE e.usuario_actual_id = ?
  `

  conexion.query(sql, [idUsuario, idUsuario], (error, equipos) => {
    if (error) {
      console.error("Error al obtener equipos del usuario:", error)
      req.flash("error", "Error al cargar tus equipos")
      return res.redirect("/")
    }

    res.render("mi-equipo/index", { equipos })
  })
}

// Ver detalles de un equipo específico
// Aqui podemos ver los detalles un equipo en especifico
exports.verDetallesEquipo = (req, res) => {
  const idEquipo = req.params.id
  const idUsuario = req.session.usuario.id

  // Verificamos que el equipo si perteneza al usuario
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

      // Obtenemos el historial de reparaciones con informaciond el tecnico
      const queryReparaciones = `
        SELECT r.*, t.nombre AS nombre_tecnico, t.telefono AS telefono_tecnico
        FROM reparaciones r
        LEFT JOIN usuarios t ON r.tecnico_id = t.id_usuario
        WHERE r.equipo_id = ?
        ORDER BY r.fecha_inicio DESC
      `

      conexion.query(queryReparaciones, [idEquipo], (error, reparaciones) => {
        if (error) {
          console.error("Error al obtener historial de reparaciones:", error)
          req.flash("error", "Error al cargar el historial de reparaciones")
          return res.redirect("/mi-equipo")
        }

        // Obtenemos la repacion activa si este tiene una
        const reparacionActiva = reparaciones.find((r) => r.estado === "pendiente" || r.estado === "en_proceso")

        // Obtener historial de asignaciones
        const queryAsignaciones = `
          SELECT a.*, u.nombre AS nombre_usuario, a.razon_asignacion AS motivo
          FROM asignaciones a
          LEFT JOIN usuarios u ON a.usuario_id = u.id_usuario
          WHERE a.equipo_id = ?
          ORDER BY a.fecha_asignacion DESC
        `

        conexion.query(queryAsignaciones, [idEquipo], (error, historialAsignaciones) => {
          if (error) {
            console.error("Error al obtener historial de asignaciones:", error)
            // Continue rendering even if there's an error with asignaciones
            return res.render("mi-equipo/detalles", {
              equipo,
              reparaciones,
              reparacionActiva,
              historialAsignaciones: [], // Empty array as fallback
            })
          }

          res.render("mi-equipo/detalles", {
            equipo,
            reparaciones,
            reparacionActiva,
            historialAsignaciones,
          })
        })
      })
    },
  )
}

//Funcion para regresa los equipos que estan en buen estado para que estos sean asignados a otrousuarios
exports.devolverEquipo = (req, res) => {
  const idEquipo = req.params.id
  const idUsuario = req.session.usuario.id

  // Verificamos que le equio pertenezca al usuario
  conexion.query(
    "SELECT * FROM equipos WHERE id_equipo = ? AND usuario_actual_id = ?",
    [idEquipo, idUsuario],
    (error, resultados) => {
      if (error) {
        console.error("Error al verificar equipo:", error)
        req.flash("error", "Error al procesar la devolución")
        return res.redirect("/mi-equipo")
      }

      if (resultados.length === 0) {
        req.flash("error", "No tienes acceso a este equipo")
        return res.redirect("/mi-equipo")
      }

      // Verificamos que el equipo este en reparacion para poder devolver
      if (resultados[0].estado === "en_reparacion") {
        req.flash("error", "No puedes devolver un equipo que está en reparación")
        return res.redirect(`/mi-equipo/detalles/${idEquipo}`)
      }

      //Actualizamos el estado del quipo a disponible para poder asignados a otros usuarios
      conexion.query(
        "UPDATE equipos SET estado = 'disponible', usuario_actual_id = NULL WHERE id_equipo = ?",
        [idEquipo],
        (error) => {
          if (error) {
            console.error("Error al actualizar estado del equipo:", error)
            req.flash("error", "Error al procesar la devolución")
            return res.redirect("/mi-equipo")
          }

          //Actualizamos la asignacion a estado de devuelto
          conexion.query(
            "UPDATE asignaciones SET estado = 'devuelto', fecha_devolucion = NOW() WHERE equipo_id = ? AND usuario_id = ? AND estado = 'activa'",
            [idEquipo, idUsuario],
            (error) => {
              if (error) {
                console.error("Error al actualizar asignación:", error)
                req.flash("error", "Error al procesar la devolución")
                return res.redirect("/mi-equipo")
              }

              req.flash("success", "Equipo devuelto correctamente")
              res.redirect("/mi-equipo")
            },
          )
        },
      )
    },
  )
}

//Funcion para reportar un equipo para que sea reparado por alguna falla
exports.reportarParaReparacion = (req, res) => {
  const idEquipo = req.params.id
  const idUsuario = req.session.usuario.id
  const { descripcion_problema } = req.body

  // Verifiamos que el equipo pertenezca al usuario
  conexion.query(
    "SELECT * FROM equipos WHERE id_equipo = ? AND usuario_actual_id = ?",
    [idEquipo, idUsuario],
    (error, resultados) => {
      if (error) {
        console.error("Error al verificar equipo:", error)
        req.flash("error", "Error al procesar la solicitud de reparación")
        return res.redirect("/mi-equipo")
      }

      if (resultados.length === 0) {
        req.flash("error", "No tienes acceso a este equipo")
        return res.redirect("/mi-equipo")
      }

      // Verificamos que el equipo no este en reparacion
      if (resultados[0].estado === "en_reparacion") {
        req.flash("error", "Este equipo ya está en proceso de reparación")
        return res.redirect(`/mi-equipo/detalles/${idEquipo}`)
      }

      //Inciamos la transaccion
      conexion.beginTransaction((err) => {
        if (err) {
          console.error("Error al iniciar transacción:", err)
          req.flash("error", "Error al procesar la solicitud de reparación")
          return res.redirect("/mi-equipo")
        }

        // Actualizmaos el estado del equipo para que este en reparacion
        conexion.query("UPDATE equipos SET estado = 'en_reparacion' WHERE id_equipo = ?", [idEquipo], (error) => {
          if (error) {
            return conexion.rollback(() => {
              console.error("Error al actualizar estado del equipo:", error)
              req.flash("error", "Error al procesar la solicitud de reparación")
              res.redirect("/mi-equipo")
            })
          }

          // funcion para asignar el estado de pendiente cuando cuando aun no esta reparado
          conexion.query(
            "INSERT INTO reparaciones (equipo_id, usuario_solicitante_id, descripcion_problema, estado, fecha_inicio) VALUES (?, ?, ?, 'pendiente', NOW())",
            [idEquipo, idUsuario, descripcion_problema],
            (error, resultado) => {
              if (error) {
                return conexion.rollback(() => {
                  console.error("Error al crear reparación:", error)
                  req.flash("error", "Error al procesar la solicitud de reparación")
                  res.redirect("/mi-equipo")
                })
              }

              //confirmamos la transaccion
              conexion.commit((err) => {
                if (err) {
                  return conexion.rollback(() => {
                    console.error("Error al confirmar transacción:", err)
                    req.flash("error", "Error al procesar la solicitud de reparación")
                    res.redirect("/mi-equipo")
                  })
                }

                req.flash(
                  "success",
                  "Solicitud de reparación enviada correctamente. Un técnico revisará tu equipo pronto.",
                )
                res.redirect(`/mi-equipo/detalles/${idEquipo}`)
              })
            },
          )
        })
      })
    },
  )
}

// Add this method to show equipment history for the user
exports.mostrarHistorial = (req, res) => {
  const idUsuario = req.session.usuario.id

  // Query to get all equipment ever assigned to this user, including past assignments
  const query = `
    SELECT DISTINCT e.*, a.fecha_asignacion, a.fecha_devolucion, a.razon_asignacion, a.estado AS estado_asignacion
    FROM equipos e
    JOIN asignaciones a ON e.id_equipo = a.equipo_id
    WHERE a.usuario_id = ?
    ORDER BY a.fecha_asignacion DESC
  `

  // Execute the query
  conexion.query(query, [idUsuario], (error, equipos) => {
    if (error) {
      console.error("Error al obtener historial de equipos:", error)
      req.flash("error", "Error al cargar el historial de equipos")
      return res.redirect("/mi-equipo")
    }

    // Get repair history for each equipment
    const equiposConReparaciones = []
    let equiposProcesados = 0

    if (equipos.length === 0) {
      return res.render("mi-equipo/historial", {
        equipos: [],
        mensajes: req.flash(),
      })
    }

    equipos.forEach((equipo) => {
      const reparacionesQuery = `
        SELECT r.*, t.nombre AS nombre_tecnico
        FROM reparaciones r
        LEFT JOIN usuarios t ON r.tecnico_id = t.id_usuario
        WHERE r.equipo_id = ? AND r.estado IN ('reparado', 'descartado')
        ORDER BY r.fecha_finalizacion DESC
      `

      conexion.query(reparacionesQuery, [equipo.id_equipo], (error, reparaciones) => {
        equiposProcesados++

        if (!error) {
          equipo.reparaciones = reparaciones
        } else {
          console.error(`Error al obtener reparaciones para equipo ${equipo.id_equipo}:`, error)
          equipo.reparaciones = []
        }

        equiposConReparaciones.push(equipo)

        if (equiposProcesados === equipos.length) {
          // Sort by assignment date (newest first)
          equiposConReparaciones.sort((a, b) => new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion))

          res.render("mi-equipo/historial", {
            equipos: equiposConReparaciones,
            mensajes: req.flash(),
          })
        }
      })
    })
  })
}

