const conexion = require("../database/db")

// Agregar:
const bitacorasController = require("./bitacorasController")

//Mostramos todas las repaciones disponibles
exports.mostrarReparaciones = (req, res) => {
  // Con esta consulta obtenemos todas las repaciones con informacion de equipos, usuarios y tecnicos
  const query = `
      SELECT r.*, 
             e.nombre AS nombre_equipo, e.marca, e.modelo, e.tipo,
             us.nombre AS nombre_solicitante, 
             t.nombre AS nombre_tecnico
      FROM reparaciones r
      LEFT JOIN equipos e ON r.equipo_id = e.id_equipo
      LEFT JOIN usuarios us ON r.usuario_solicitante_id = us.id_usuario
      LEFT JOIN usuarios t ON r.tecnico_id = t.id_usuario
      ORDER BY 
          CASE 
              WHEN r.estado = 'pendiente' THEN 1
              WHEN r.estado = 'en_proceso' THEN 2
              WHEN r.estado = 'reparado' THEN 3
              WHEN r.estado = 'descartado' THEN 4
          END,
          r.fecha_inicio DESC
  `

  conexion.query(query, (error, reparaciones) => {
    if (error) {
      console.error("Error al obtener reparaciones:", error)
      req.flash("error", "Error al cargar las reparaciones")
      return res.redirect("/")
    }

    // Obtenemos el tecnico para el formulario de asignacion de un tecnico a un equipo
    conexion.query('SELECT id_usuario, nombre FROM usuarios WHERE rol = "tecnico"', (error, tecnicos) => {
      if (error) {
        console.error("Error al obtener técnicos:", error)
        req.flash("error", "Error al cargar los técnicos")
        return res.render("reparaciones/index", { reparaciones, tecnicos: [] })
      }

      res.render("reparaciones/index", {
        reparaciones,
        tecnicos,
        usuario: req.session.usuario,
      })
    })
  })
}

// Podemos ver los detalles de una repacion
exports.verDetallesReparacion = (req, res) => {
  const id_reparacion = req.params.id

  // Consulta para obtener detalles de la reparación
  const query = `
      SELECT r.*, 
             e.nombre AS nombre_equipo, e.marca, e.modelo, e.tipo, e.numero_serie,
             us.nombre AS nombre_solicitante, us.correo AS correo_solicitante, us.telefono AS telefono_solicitante,
             t.nombre AS nombre_tecnico, t.correo AS correo_tecnico, t.telefono AS telefono_tecnico
      FROM reparaciones r
      LEFT JOIN equipos e ON r.equipo_id = e.id_equipo
      LEFT JOIN usuarios us ON r.usuario_solicitante_id = us.id_usuario
      LEFT JOIN usuarios t ON r.tecnico_id = t.id_usuario
      WHERE r.id_reparacion = ?
  `

  conexion.query(query, [id_reparacion], (error, resultado) => {
    if (error) {
      console.error("Error al obtener detalles de reparación:", error)
      req.flash("error", "Error al cargar los detalles de la reparación")
      return res.redirect("/reparaciones")
    }

    if (resultado.length === 0) {
      req.flash("error", "Reparación no encontrada")
      return res.redirect("/reparaciones")
    }

    // Obtenemos tecnicos para asignar la reparacion buscamos los usuarios con el rol de tecnico para asignarle una reparacion
    conexion.query('SELECT id_usuario, nombre FROM usuarios WHERE rol = "tecnico"', (error, tecnicos) => {
      if (error) {
        console.error("Error al obtener técnicos:", error)
        return res.render("reparaciones/detalles", {
          reparacion: resultado[0],
          tecnicos: [],
          usuario: req.session.usuario,
        })
      }

      res.render("reparaciones/detalles", {
        reparacion: resultado[0],
        tecnicos,
        usuario: req.session.usuario,
      })
    })
  })
}

//Asignamos un tecnico a una repacion (esta funcion solo es para los admin de l sistema)
exports.asignarTecnico = (req, res) => {
  const id_reparacion = req.params.id
  const tecnico_id = req.body.tecnico_id

  if (!tecnico_id) {
    req.flash("error", "Debe seleccionar un técnico")
    return res.redirect(`/reparaciones/detalles/${id_reparacion}`)
  }

  // actualizmaos la reparacion con el tecnico asignado y cambiar el estado a en reparacion para que el usuario se dio cuenta que su casa ya esta tomado por un tecnico
  conexion.query(
    "UPDATE reparaciones SET tecnico_id = ?, estado = 'en_proceso', fecha_asignacion = NOW() WHERE id_reparacion = ?",
    [tecnico_id, id_reparacion],
    (error) => {
      if (error) {
        console.error("Error al asignar técnico:", error)
        req.flash("error", "Error al asignar el técnico")
        return res.redirect(`/reparaciones/detalles/${id_reparacion}`)
      }

      // Agregar este código para registrar en bitácora:
      bitacorasController.registrarEvento(
        "reparacion",
        id_reparacion,
        "reparaciones",
        `Técnico asignado a la reparación #${id_reparacion}`,
        req.session.usuario.id,
        { cambios: { tecnico_id, estado: "en_proceso" } },
      )

      req.flash("success", "Técnico asignado correctamente")
      res.redirect(`/reparaciones/detalles/${id_reparacion}`)
    },
  )
}

// Con esta funcion tomamos un caso de reparacion (Esta funcion es para los tecnicos para que estos puedan tomar una repacion por su propia cuenta)
exports.tomarCaso = (req, res) => {
  const id_reparacion = req.params.id
  const tecnico_id = req.session.usuario.id

  // Tambien actualizamos la repacion el tecnico que tomo el caso y cambiamos el estado a en proceso para avisar al usuario final
  conexion.query(
    "UPDATE reparaciones SET tecnico_id = ?, estado = 'en_proceso', fecha_asignacion = NOW() WHERE id_reparacion = ?",
    [tecnico_id, id_reparacion],
    (error) => {
      if (error) {
        console.error("Error al tomar el caso:", error)
        req.flash("error", "Error al tomar el caso")
        return res.redirect(`/reparaciones/detalles/${id_reparacion}`)
      }

      // Agregar este código para registrar en bitácora:
      bitacorasController.registrarEvento(
        "reparacion",
        id_reparacion,
        "reparaciones",
        `Técnico #${tecnico_id} tomó el caso de reparación #${id_reparacion}`,
        req.session.usuario.id,
        { cambios: { tecnico_id, estado: "en_proceso" } },
      )

      req.flash("success", "Has tomado el caso correctamente")
      res.redirect(`/reparaciones/detalles/${id_reparacion}`)
    },
  )
}

// Aqui marcamos la repacion como completada
exports.completarReparacion = (req, res) => {
  const id_reparacion = req.params.id
  const { solucion_aplicada } = req.body

  if (!solucion_aplicada) {
    req.flash("error", "Debe proporcionar la solución aplicada")
    return res.redirect(`/reparaciones/detalles/${id_reparacion}`)
  }

  // Primero obtenemos el equipo para actualiza el estado este mismo
  conexion.query(
    "SELECT equipo_id, usuario_solicitante_id FROM reparaciones WHERE id_reparacion = ?",
    [id_reparacion],
    (error, resultado) => {
      if (error || resultado.length === 0) {
        console.error("Error al obtener información de la reparación:", error)
        req.flash("error", "Error al completar la reparación")
        return res.redirect(`/reparaciones/detalles/${id_reparacion}`)
      }

      const equipo_id = resultado[0].equipo_id
      const usuario_id = resultado[0].usuario_solicitante_id

      // Iniciamos la transaccion
      conexion.beginTransaction((err) => {
        if (err) {
          console.error("Error al iniciar transacción:", err)
          req.flash("error", "Error al completar la reparación")
          return res.redirect(`/reparaciones/detalles/${id_reparacion}`)
        }

        // Actualizamos la reparacion
        conexion.query(
          "UPDATE reparaciones SET estado = 'reparado', solucion_aplicada = ?, fecha_finalizacion = NOW() WHERE id_reparacion = ?",
          [solucion_aplicada, id_reparacion],
          (error) => {
            if (error) {
              return conexion.rollback(() => {
                console.error("Error al actualizar reparación:", error)
                req.flash("error", "Error al completar la reparación")
                res.redirect(`/reparaciones/detalles/${id_reparacion}`)
              })
            }

            // Actualizamos el estado del equipo a signado si tien usuario o usuario, o disponible si no lo tiene
            const nuevoEstado = usuario_id ? "asignado" : "disponible"

            conexion.query("UPDATE equipos SET estado = ? WHERE id_equipo = ?", [nuevoEstado, equipo_id], (error) => {
              if (error) {
                return conexion.rollback(() => {
                  console.error("Error al actualizar equipo:", error)
                  req.flash("error", "Error al completar la reparación")
                  res.redirect(`/reparaciones/detalles/${id_reparacion}`)
                })
              }

              // confirmamos la transaccion
              conexion.commit((err) => {
                if (err) {
                  return conexion.rollback(() => {
                    console.error("Error al confirmar transacción:", err)
                    req.flash("error", "Error al completar la reparación")
                    res.redirect(`/reparaciones/detalles/${id_reparacion}`)
                  })
                }

                // Agregar este código para registrar en bitácora:
                bitacorasController.registrarEvento(
                  "reparacion",
                  id_reparacion,
                  "reparaciones",
                  `Reparación #${id_reparacion} completada`,
                  req.session.usuario.id,
                  {
                    cambios: {
                      estado: "reparado",
                      solucion_aplicada,
                      equipo_estado: nuevoEstado,
                    },
                  },
                )

                req.flash("success", "Reparación completada correctamente")
                res.redirect("/reparaciones")
              })
            })
          },
        )
      })
    },
  )
}

// Con esta funcion marcamos la repacion como descartada
exports.descartarReparacion = (req, res) => {
  const id_reparacion = req.params.id
  const { motivo_descarte } = req.body

  if (!motivo_descarte) {
    req.flash("error", "Debe proporcionar el motivo del descarte")
    return res.redirect(`/reparaciones/detalles/${id_reparacion}`)
  }

  // Primero obtenemos el equipo para actualizar su estado
  conexion.query("SELECT equipo_id FROM reparaciones WHERE id_reparacion = ?", [id_reparacion], (error, resultado) => {
    if (error || resultado.length === 0) {
      console.error("Error al obtener información de la reparación:", error)
      req.flash("error", "Error al descartar la reparación")
      return res.redirect(`/reparaciones/detalles/${id_reparacion}`)
    }

    const equipo_id = resultado[0].equipo_id

    //iniciamos la transaccion
    conexion.beginTransaction((err) => {
      if (err) {
        console.error("Error al iniciar transacción:", err)
        req.flash("error", "Error al descartar la reparación")
        return res.redirect(`/reparaciones/detalles/${id_reparacion}`)
      }

      //actualizamos la repacion
      conexion.query(
        "UPDATE reparaciones SET estado = 'descartado', motivo_descarte = ?, fecha_finalizacion = NOW() WHERE id_reparacion = ?",
        [motivo_descarte, id_reparacion],
        (error) => {
          if (error) {
            return conexion.rollback(() => {
              console.error("Error al actualizar reparación:", error)
              req.flash("error", "Error al descartar la reparación")
              res.redirect(`/reparaciones/detalles/${id_reparacion}`)
            })
          }

          // actualiamos el estado del equipo a dado de baja porque este equipo no se reparo
          conexion.query(
            "UPDATE equipos SET estado = 'dado_de_baja', usuario_actual_id = NULL WHERE id_equipo = ?",
            [equipo_id],
            (error) => {
              if (error) {
                return conexion.rollback(() => {
                  console.error("Error al actualizar equipo:", error)
                  req.flash("error", "Error al descartar la reparación")
                  res.redirect(`/reparaciones/detalles/${id_reparacion}`)
                })
              }

              // confirmamos la transaccion
              conexion.commit((err) => {
                if (err) {
                  return conexion.rollback(() => {
                    console.error("Error al confirmar transacción:", err)
                    req.flash("error", "Error al descartar la reparación")
                    res.redirect(`/reparaciones/detalles/${id_reparacion}`)
                  })
                }

                // Agregar este código para registrar en bitácora:
                bitacorasController.registrarEvento(
                  "reparacion",
                  id_reparacion,
                  "reparaciones",
                  `Reparación #${id_reparacion} descartada`,
                  req.session.usuario.id,
                  {
                    cambios: {
                      estado: "descartado",
                      motivo_descarte,
                      equipo_estado: "dado_de_baja",
                    },
                  },
                )

                req.flash("success", "Equipo descartado correctamente")
                res.redirect("/reparaciones")
              })
            },
          )
        },
      )
    })
  })
}

// Creamos un nueva repacion (Esta funcion es para los tenicos)
exports.crearReparacion = (req, res) => {
  const { equipo_id, tecnico_id, descripcion_problema, estado } = req.body

  if (!equipo_id || !tecnico_id || !descripcion_problema) {
    req.flash("error", "Todos los campos son obligatorios")
    return res.redirect("/reparaciones")
  }

  // Creamos la repacion tomando los siguiente datos
  const nuevaReparacion = {
    equipo_id,
    tecnico_id,
    descripcion_problema,
    estado: estado || "en_proceso",
    fecha_inicio: new Date(),
    fecha_asignacion: new Date(),
  }

  //iniciamos la teansaccion
  conexion.beginTransaction((err) => {
    if (err) {
      console.error("Error al iniciar transacción:", err)
      req.flash("error", "Error al crear la reparación")
      return res.redirect("/reparaciones")
    }

    //insetamos la repacion
    conexion.query("INSERT INTO reparaciones SET ?", nuevaReparacion, (error, resultado) => {
      if (error) {
        return conexion.rollback(() => {
          console.error("Error al crear reparación:", error)
          req.flash("error", "Error al crear la reparación")
          res.redirect("/reparaciones")
        })
      }

      //actualizamos el estado del equipo elegido para poner el estado de en repacion
      conexion.query("UPDATE equipos SET estado = 'en_reparacion' WHERE id_equipo = ?", [equipo_id], (error) => {
        if (error) {
          return conexion.rollback(() => {
            console.error("Error al actualizar equipo:", error)
            req.flash("error", "Error al crear la reparación")
            res.redirect("/reparaciones")
          })
        }

        //confirmamos la transccion
        conexion.commit((err) => {
          if (err) {
            return conexion.rollback(() => {
              console.error("Error al confirmar transacción:", err)
              req.flash("error", "Error al crear la reparación")
              res.redirect("/reparaciones")
            })
          }

          req.flash("success", "Reparación creada correctamente")
          res.redirect("/reparaciones")
        })
      })
    })
  })
}

//Cargamos el formulario para crear la repacion
exports.cargarFormularioCrear = (req, res) => {
  // Obtener técnicos
  conexion.query('SELECT id_usuario, nombre FROM usuarios WHERE rol = "tecnico"', (error, tecnicos) => {
    if (error) {
      console.error("Error al obtener técnicos:", error)
      req.flash("error", "Error al cargar el formulario")
      return res.redirect("/reparaciones")
    }

    //Obtenemos equipos dispobles o asignados (no en reparacion ni dados de baja)
    conexion.query(
      'SELECT e.*, u.nombre AS nombre_usuario FROM equipos e LEFT JOIN usuarios u ON e.usuario_actual_id = u.id_usuario WHERE e.estado IN ("disponible", "asignado")',
      (error, equipos) => {
        if (error) {
          console.error("Error al obtener equipos:", error)
          req.flash("error", "Error al cargar el formulario")
          return res.redirect("/reparaciones")
        }

        res.render("reparaciones/crear", { tecnicos, equipos })
      },
    )
  })
}

//funcion par que tenemos
exports.saveReparacion = (req, res) => {
  const equipo_id = req.body.equipo_id
  const usuario_solicitante_id = req.body.usuario_solicitante_id || null
  const tecnico_id = req.body.tecnico_id
  const descripcion_problema = req.body.descripcion_problema
  const estado = req.body.estado || "pendiente"
  const fecha_finalizacion = req.body.fecha_finalizacion

  //inciar la transaccion
  conexion.beginTransaction((err) => {
    if (err) {
      console.error("Error al iniciar transacción:", err)
      req.flash("error", "Error al crear la reparación")
      return res.redirect("/reparaciones")
    }

    // insetamos la reparacion
    conexion.query(
      "INSERT INTO reparaciones SET ?",
      {
        equipo_id,
        usuario_solicitante_id,
        tecnico_id,
        descripcion_problema,
        estado,
        fecha_inicio: new Date(),
        fecha_asignacion: tecnico_id ? new Date() : null,
        fecha_finalizacion,
      },
      (error, resultado) => {
        if (error) {
          return conexion.rollback(() => {
            console.error("Error al crear reparación:", error)
            req.flash("error", "Error al crear la reparación")
            res.redirect("/reparaciones")
          })
        }

        // actualizamos el estado del equipo a en reparacion
        conexion.query("UPDATE equipos SET estado = 'en_reparacion' WHERE id_equipo = ?", [equipo_id], (error) => {
          if (error) {
            return conexion.rollback(() => {
              console.error("Error al actualizar equipo:", error)
              req.flash("error", "Error al crear la reparación")
              res.redirect("/reparaciones")
            })
          }

          // confirmamos la transaccion
          conexion.commit((err) => {
            if (err) {
              return conexion.rollback(() => {
                console.error("Error al confirmar transacción:", err)
                req.flash("error", "Error al crear la reparación")
                res.redirect("/reparaciones")
              })
            }

            // Agregar este código para registrar en bitácora:
            bitacorasController.registrarEvento(
              "reparacion",
              resultado.insertId,
              "reparaciones",
              `Nueva reparación creada para el equipo #${equipo_id}`,
              req.session.usuario.id,
              {
                datos: {
                  equipo_id,
                  usuario_solicitante_id,
                  tecnico_id,
                  descripcion_problema,
                  estado,
                },
              },
            )

            req.flash("success", "Reparación creada correctamente")
            res.redirect("/reparaciones")
          })
        })
      },
    )
  })
}

// corregi unos errores en la funcion de updatereparacion
exports.updateReparacion = (req, res) => {
  const id_reparacion = req.body.id_reparacion || req.query.id_reparacion
  let {
    equipo_id,
    usuario_solicitante_id,
    tecnico_id,
    descripcion_problema,
    estado,
    fecha_inicio,
    fecha_finalizacion,
    solucion_aplicada,
    motivo_descarte,
  } = req.body

  if (usuario_solicitante_id === "") usuario_solicitante_id = null

  //obtenemos el estado actual para comparar
  conexion.query(
    "SELECT estado, equipo_id FROM reparaciones WHERE id_reparacion = ?",
    [id_reparacion],
    (error, resultado) => {
      if (error || resultado.length === 0) {
        console.error("Error al obtener información de la reparación:", error)
        req.flash("error", "Error al actualizar la reparación")
        return res.redirect("/reparaciones")
      }

      const estadoAnterior = resultado[0].estado
      const equipo_id = resultado[0].equipo_id

      //iniciamos la transaccion
      conexion.beginTransaction((err) => {
        if (err) {
          console.error("Error al iniciar transacción:", err)
          req.flash("error", "Error al actualizar la reparación")
          return res.redirect("/reparaciones")
        }

        // datos que se tienen que actualizar
        const datosActualizacion = {
          equipo_id,
          usuario_solicitante_id,
          tecnico_id,
          descripcion_problema,
          estado,
          fecha_inicio,
          fecha_finalizacion,
        }

        // si hay cambios de estado en proceso y no habia tecnico antes
        if (estado === "en_proceso" && estadoAnterior === "pendiente" && tecnico_id) {
          datosActualizacion.fecha_asignacion = new Date()
        }

        //si hay cambio de estado a reparado o descartado
        if (
          (estado === "reparado" || estado === "descartado") &&
          estadoAnterior !== "reparado" &&
          estadoAnterior !== "descartado"
        ) {
          datosActualizacion.fecha_finalizacion = new Date()
        }

        //si se proporciona solucion o motivo de descarte
        if (solucion_aplicada) datosActualizacion.solucion_aplicada = solucion_aplicada
        if (motivo_descarte) datosActualizacion.motivo_descarte = motivo_descarte

        // actualizmaos la reparacion
        conexion.query(
          "UPDATE reparaciones SET ? WHERE id_reparacion = ?",
          [datosActualizacion, id_reparacion],
          (error) => {
            if (error) {
              return conexion.rollback(() => {
                console.error("Error al actualizar reparación:", error)
                req.flash("error", "Error al actualizar la reparación")
                res.redirect("/reparaciones")
              })
            }

            //actualiamos el estado del equipo segun el estado de la reparacion
            let nuevoEstadoEquipo = null

            if (estado === "reparado") {
              // si esta repado, verificamos si tiene usuario asignado
              if (usuario_solicitante_id) {
                nuevoEstadoEquipo = "asignado"
              } else {
                nuevoEstadoEquipo = "disponible"
              }
            } else if (estado === "descartado") {
              nuevoEstadoEquipo = "dado_de_baja"
            }

            if (nuevoEstadoEquipo) {
              const actualizacionEquipo = {
                estado: nuevoEstadoEquipo,
              }

              //so el equipo esta dado de baja, le quitamos el usuario que tenia asignado
              if (nuevoEstadoEquipo === "dado_de_baja") {
                actualizacionEquipo.usuario_actual_id = null
              }

              conexion.query(
                "UPDATE equipos SET ? WHERE id_equipo = ?",
                [actualizacionEquipo, equipo_id],
                (errorEquipo) => {
                  if (errorEquipo) {
                    return conexion.rollback(() => {
                      console.error("Error al actualizar equipo:", errorEquipo)
                      req.flash("error", "Error al actualizar el estado del equipo")
                      res.redirect("/reparaciones")
                    })
                  }

                  //confirmacioms la transaccion
                  conexion.commit((err) => {
                    if (err) {
                      return conexion.rollback(() => {
                        console.error("Error al confirmar transacción:", err)
                        req.flash("error", "Error al actualizar la reparación")
                        res.redirect("/reparaciones")
                      })
                    }

                    // Agregar este código para registrar en bitácora:
                    bitacorasController.registrarEvento(
                      "reparacion",
                      id_reparacion,
                      "reparaciones",
                      `Reparación #${id_reparacion} actualizada`,
                      req.session.usuario.id,
                      {
                        cambios: datosActualizacion,
                        estado_anterior: estadoAnterior,
                      },
                    )

                    req.flash("success", "Reparación actualizada correctamente")
                    res.redirect("/reparaciones")
                  })
                },
              )
            } else {
              // si no hay cambios de estado del equipo confirmamos la transaccion
              conexion.commit((err) => {
                if (err) {
                  return conexion.rollback(() => {
                    console.error("Error al confirmar transacción:", err)
                    req.flash("error", "Error al actualizar la reparación")
                    res.redirect("/reparaciones")
                  })
                }

                req.flash("success", "Reparación actualizada correctamente")
                res.redirect("/reparaciones")
              })
            }
          },
        )
      })
    },
  )
}

exports.deleteReparacion = (req, res) => {
  const id_reparacion = req.body.id_reparacion

  //obtenemos informacion de reparacion antes de ser eliminada
  conexion.query(
    "SELECT equipo_id, estado FROM reparaciones WHERE id_reparacion = ?",
    [id_reparacion],
    (error, resultado) => {
      if (error || resultado.length === 0) {
        console.error("Error al obtener información de la reparación:", error)
        req.flash("error", "Error al eliminar la reparación")
        return res.redirect("/reparaciones")
      }

      const equipo_id = resultado[0].equipo_id
      const estadoReparacion = resultado[0].estado

      //iniciamos transaccion
      conexion.beginTransaction((err) => {
        if (err) {
          console.error("Error al iniciar transacción:", err)
          req.flash("error", "Error al eliminar la reparación")
          return res.redirect("/reparaciones")
        }

        // con este query eliminamos la repacion
        conexion.query("DELETE from reparaciones WHERE id_reparacion = ?", [id_reparacion], (error) => {
          if (error) {
            return conexion.rollback(() => {
              console.error("Error al eliminar reparación:", error)
              req.flash("error", "Error al eliminar la reparación")
              res.redirect("/reparaciones")
            })
          }

          // actulaizar el estado del quipo a disponible si la repacion no estava completada
          if (estadoReparacion !== "reparado" && estadoReparacion !== "descartado") {
            conexion.query(
              'UPDATE equipos SET estado = "disponible" WHERE id_equipo = ?',
              [equipo_id],
              (errorEquipo) => {
                if (errorEquipo) {
                  return conexion.rollback(() => {
                    console.error("Error al actualizar equipo:", errorEquipo)
                    req.flash("error", "Error al actualizar el estado del equipo")
                    res.redirect("/reparaciones")
                  })
                }

                //confrimamos la transaccion
                conexion.commit((err) => {
                  if (err) {
                    return conexion.rollback(() => {
                      console.error("Error al confirmar transacción:", err)
                      req.flash("error", "Error al eliminar la reparación")
                      res.redirect("/reparaciones")
                    })
                  }

                  // Agregar este código para registrar en bitácora:
                  bitacorasController.registrarEvento(
                    "reparacion",
                    id_reparacion,
                    "reparaciones",
                    `Reparación #${id_reparacion} eliminada`,
                    req.session.usuario.id,
                    {
                      estado_anterior: estadoReparacion,
                      equipo_id,
                    },
                  )

                  req.flash("success", "Reparación eliminada correctamente")
                  res.redirect("/reparaciones")
                })
              },
            )
          } else {
            // si la reparacion ya estaba completada, no cambiar el estado del quipo
            conexion.commit((err) => {
              if (err) {
                return conexion.rollback(() => {
                  console.error("Error al confirmar transacción:", err)
                  req.flash("error", "Error al eliminar la reparación")
                  res.redirect("/reparaciones")
                })
              }

              req.flash("success", "Reparación eliminada correctamente")
              res.redirect("/reparaciones")
            })
          }
        })
      })
    },
  )
}

exports.viewReparacion = (req, res) => {
  const id_reparacion = req.params.id

  const query = `
      SELECT r.*, 
             e.nombre AS nombre_equipo, e.marca, e.modelo, e.tipo,
             us.nombre AS nombre_solicitante, 
             t.nombre AS nombre_tecnico
      FROM reparaciones r
      LEFT JOIN equipos e ON r.equipo_id = e.id_equipo
      LEFT JOIN usuarios us ON r.usuario_solicitante_id = us.id_usuario
      LEFT JOIN usuarios t ON r.tecnico_id = t.id_usuario
      WHERE r.id_reparacion = ?
  `

  conexion.query(query, [id_reparacion], (error, resultado) => {
    if (error) {
      console.error("Error al obtener reparación:", error)
      req.flash("error", "Error al cargar la reparación")
      return res.redirect("/reparaciones")
    }

    if (resultado.length === 0) {
      req.flash("error", "Reparación no encontrada")
      return res.redirect("/reparaciones")
    }

    res.render("reparaciones/ver", {
      reparacion: resultado[0],
      usuario: req.session.usuario,
    })
  })
}

//obtebemos la repaciones por estado
exports.getReparacionesPorEstado = (req, res) => {
  const estado = req.query.estado
  const estadosPermitidos = ["pendiente", "en_proceso", "reparado", "descartado"]

  if (!estadosPermitidos.includes(estado)) {
    return res.render("reparaciones/index", { reparaciones: [], tecnicos: [] })
  }

  const query = `
      SELECT r.*, 
             e.nombre AS nombre_equipo, e.marca, e.modelo, e.tipo,
             us.nombre AS nombre_solicitante, 
             t.nombre AS nombre_tecnico
      FROM reparaciones r
      LEFT JOIN equipos e ON r.equipo_id = e.id_equipo
      LEFT JOIN usuarios us ON r.usuario_solicitante_id = us.id_usuario
      LEFT JOIN usuarios t ON r.tecnico_id = t.id_usuario
      WHERE r.estado = ?
      ORDER BY r.fecha_inicio DESC
  `

  conexion.query(query, [estado], (error, reparaciones) => {
    if (error) {
      console.error("Error al obtener reparaciones:", error)
      req.flash("error", "Error al cargar las reparaciones")
      return res.redirect("/reparaciones")
    }

    // obtenemos el tecnico para el formulario de asignacion
    conexion.query('SELECT id_usuario, nombre FROM usuarios WHERE rol = "tecnico"', (error, tecnicos) => {
      if (error) {
        console.error("Error al obtener técnicos:", error)
        return res.render("reparaciones/index", {
          reparaciones,
          tecnicos: [],
          usuario: req.session.usuario,
        })
      }

      res.render("reparaciones/index", {
        reparaciones,
        tecnicos,
        usuario: req.session.usuario,
      })
    })
  })
}

//cargamos los tecnicos para el formulario de crear repacion
exports.cargarTecnicos = (req, res) => {
  const queryTecnicos = 'SELECT id_usuario, nombre FROM usuarios WHERE rol = "tecnico"'
  const queryEquipos = `SELECT e.id_equipo, e.nombre, e.usuario_actual_id FROM equipos e
      WHERE e.estado = 'en_reparacion' AND e.id_equipo NOT IN 
      (
          SELECT equipo_id
          FROM reparaciones
          WHERE estado IN ('pendiente', 'en_proceso')
      )`

  conexion.query(queryTecnicos, (errorTecnicos, tecnicos) => {
    if (errorTecnicos) {
      console.log(errorTecnicos)
      return res.render("reparacion/crear", { tecnicos: [], equipos: [] })
    }

    conexion.query(queryEquipos, (errorEquipos, equipos) => {
      if (errorEquipos) {
        console.log(errorEquipos)
        return res.render("reparacion/crear", { tecnicos, equipos: [] })
      }

      res.render("reparacion/crear", { tecnicos, equipos })
    })
  })
}

