const conexion = require("../database/db")

// Mostrar equipos asignados al usuario actual
exports.mostrarMisEquipos = (req, res) => {
  const idUsuario = req.session.usuario.id

  // COnsulta para obtener los equipos que fueron asignados al usuario con informacion reparaciones
  const sql = `
    SELECT e.*, 
         r.id_reparacion, r.estado AS estado_reparacion, r.descripcion_problema, 
         r.fecha_inicio, r.fecha_finalizacion,
         t.nombre AS nombre_tecnico, t.telefono AS telefono_tecnico
    FROM equipos e
    LEFT JOIN reparaciones r ON e.id_equipo = r.equipo_id AND r.estado != 'reparado'
    LEFT JOIN usuarios t ON r.tecnico_id = t.id_usuario
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

        res.render("mi-equipo/detalles", {
          equipo,
          reparaciones,
          reparacionActiva,
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

