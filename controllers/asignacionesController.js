// controllers/asignacionesController.js
const conexion = require("../database/db")

// Con esta funcion obtenemos todas las asignaciones y rendirzamos la vista
exports.mostrarAsignaciones = (req, res) => {
  conexion.query(
    `
    SELECT 
        asignaciones.id_asignacion,
        asignaciones.estado,
        asignaciones.fecha_asignacion,
        asignaciones.fecha_devolucion,
        asignaciones.razon_asignacion,
        asignaciones.observaciones,
        usuarios.nombre AS nombre_usuario,
        equipos.nombre AS nombre_equipo
    FROM asignaciones
    JOIN usuarios ON asignaciones.usuario_id = usuarios.id_usuario
    JOIN equipos ON asignaciones.equipo_id = equipos.id_equipo
  `,
    (error, resultados) => {
      if (error) {
        console.error("Error al obtener asignaciones:", error)
        return res.status(500).send("Error en el servidor")
      }
      // Pasamos todos los resultado a la vista de asignaciones
      return res.render("asignaciones/index", { asignaciones: resultados })
    },
  )
}

//Funcion para obtener usuarios y equipos y rendirizar la vista de crear una asignacion
exports.formCrearAsignacion = (req, res) => {
  // Aqui optenemos los usuarios de la base de datos
  conexion.query('SELECT * FROM usuarios WHERE rol = "usuario_final"', (error, usuarios) => {
    if (error) {
      console.error("Error al obtener usuarios:", error)
      return res.status(500).send("Error en el servidor")
    }

    // Aqio optenemos todos los equipos creados y estan almacenado en la base de datos
    conexion.query('SELECT * FROM equipos WHERE estado = "disponible"', (error, equipos) => {
      if (error) {
        console.error("Error al obtener equipos:", error)
        return res.status(500).send("Error en el servidor")
      }


      //Envimos los usuarios y equipos a la vista de crear
      res.render("asignaciones/crear", { usuarios: usuarios, equipos: equipos })
    })
  })
}

//Con esta funcion guardamos las nuevas asignaciones de equipos a los usuarios
exports.crearAsignacion = (req, res) => {
  const { usuario_id, equipo_id, estado, razon_asignacion, observaciones } = req.body

  if (!usuario_id || !equipo_id) {
    return res.status(400).send("Faltan datos en la solicitud")
  }

  // Si no se llana el campo de razon de asignacion u oberservaciones, este campo se guarda como null
  const nuevaAsignacion = {
    usuario_id,
    equipo_id,
    estado: estado || "activa",
    razon_asignacion: razon_asignacion || null,
    observaciones: observaciones || null,
    fecha_asignacion: new Date(),
  }

  //Iniciamos la transaccion para asegurar que ambas operaciones se completen correctamente
  conexion.beginTransaction((err) => {
    if (err) {
      console.error("Error al iniciar transacción:", err)
      return res.status(500).send("Error en el servidor")
    }

    // La primera es para agregar un nueva asignacion
    conexion.query("INSERT INTO asignaciones SET ?", nuevaAsignacion, (error, resultado) => {
      if (error) {
        return conexion.rollback(() => {
          console.error("Error al asignar equipo:", error)
          res.status(500).send("Error en el servidor")
        })
      }

      // Esta seria la segunda operacion que funciona para actualizar el esta del equipo y el usuario asignado
      const actualizacionEquipo = {
        estado: "asignado",
        usuario_actual_id: usuario_id,
      }

      conexion.query(
        "UPDATE equipos SET ? WHERE id_equipo = ?",
        [actualizacionEquipo, equipo_id],
        (error, resultado) => {
          if (error) {
            return conexion.rollback(() => {
              console.error("Error al actualizar estado del equipo:", error)
              res.status(500).send("Error en el servidor")
            })
          }

          //Confirmamos que la transaccion de hizo correctamente o si paso algun error
          conexion.commit((err) => {
            if (err) {
              return conexion.rollback(() => {
                console.error("Error al confirmar transacción:", err)
                res.status(500).send("Error en el servidor")
              })
            }

            return res.redirect("/asignaciones")
          })
        },
      )
    })
  })
}

//Con esta funcion se edita una asignacion
exports.formEditarAsignacion = (req, res) => {
  const { id } = req.params

  if (!id) {
    return res.status(400).send("ID no proporcionado")
  }

  const query = `
    SELECT 
        asignaciones.id_asignacion,
        asignaciones.estado,
        asignaciones.fecha_asignacion,
        asignaciones.fecha_devolucion,
        asignaciones.razon_asignacion,
        asignaciones.observaciones,
        asignaciones.usuario_id,
        asignaciones.equipo_id
    FROM asignaciones
    WHERE id_asignacion = ?
  `

  conexion.query(query, [id], (error, resultado) => {
    if (error) {
      console.error("Error al obtener asignación:", error)
      return res.status(500).send("Error en el servidor")
    }

    if (resultado.length === 0) {
      return res.status(404).send("Asignación no encontrada")
    }

    conexion.query("SELECT * FROM usuarios", (error, usuarios) => {
      if (error) {
        console.error("Error al obtener usuarios:", error)
        return res.status(500).send("Error en el servidor")
      }

      conexion.query("SELECT * FROM equipos", (error, equipos) => {
        if (error) {
          console.error("Error al obtener equipos:", error)
          return res.status(500).send("Error en el servidor")
        }

        return res.render("asignaciones/editar", {
          asignacion: resultado[0],
          usuarios: usuarios,
          equipos: equipos,
        })
      })
    })
  })
}

//Esta funcion actualiza una asignacion
exports.actualizarAsignacion = (req, res) => {
  const { id } = req.params
  const { usuario_id, equipo_id, estado, fecha_devolucion, razon_asignacion, observaciones } = req.body
  const estadoAnterior = req.body.estado_anterior

  if (!id) {
    console.error("ID no proporcionado para actualizar")
    return res.status(400).send("ID no proporcionado")
  }

  //Aca iniciamos la transaccion
  conexion.beginTransaction((err) => {
    if (err) {
      console.error("Error al iniciar transacción:", err)
      return res.status(500).send("Error en el servidor")
    }

    //Actualizamos la asignacion
    const actualizacion = {
      usuario_id,
      equipo_id,
      estado,
      fecha_devolucion: fecha_devolucion ? fecha_devolucion : null,
      razon_asignacion: razon_asignacion || null,
      observaciones: observaciones || null,
    }

    conexion.query("UPDATE asignaciones SET ? WHERE id_asignacion = ?", [actualizacion, id], (error, resultado) => {
      if (error) {
        return conexion.rollback(() => {
          console.error("Error al actualizar asignación:", error)
          res.status(500).send("Error en el servidor")
        })
      }

      //Aqui actualizmaos el estado del equipo segun el nuevo estado de la asignacion
      let estadoEquipo = "asignado"
      let usuarioActualId = usuario_id

      // Si el estado del equipo cambia devuelto, este actualiza el equipo a estado de disponible y quita el usuario al que se la asigno el equipo
      if (estado === "devuelto") {
        estadoEquipo = "disponible"
        usuarioActualId = null
      }

      const actualizacionEquipo = {
        estado: estadoEquipo,
        usuario_actual_id: usuarioActualId,
      }

      conexion.query(
        "UPDATE equipos SET ? WHERE id_equipo = ?",
        [actualizacionEquipo, equipo_id],
        (error, resultado) => {
          if (error) {
            return conexion.rollback(() => {
              console.error("Error al actualizar estado del equipo:", error)
              res.status(500).send("Error en el servidor")
            })
          }

          //Confirmamos que la transaccion ocurrio correctamente
          conexion.commit((err) => {
            if (err) {
              return conexion.rollback(() => {
                console.error("Error al confirmar transacción:", err)
                res.status(500).send("Error en el servidor")
              })
            }

            return res.redirect("/asignaciones")
          })
        },
      )
    })
  })
}


// Con esta funcion podemos elinar una asignacion
exports.eliminarAsignacion = (req, res) => {
  const { id } = req.params

  // Validar el ID
  if (!id) {
    console.error("ID no proporcionado para eliminar")
    return res.status(400).send("ID no proporcionado")
  }


  //Primero obtenemos la informacion de la asignacion para saber que equipo actualizar y no tener problemas con la asignacion
  conexion.query("SELECT equipo_id FROM asignaciones WHERE id_asignacion = ?", [id], (error, resultado) => {
    if (error) {
      console.error("Error al obtener información de la asignación:", error)
      return res.status(500).send("Error en el servidor")
    }

    if (resultado.length === 0) {
      console.warn("Asignación no encontrada")
      return res.status(404).send("Asignación no encontrada")
    }

    const equipo_id = resultado[0].equipo_id

    // inicioamos la transaccion
    conexion.beginTransaction((err) => {
      if (err) {
        console.error("Error al iniciar transacción:", err)
        return res.status(500).send("Error en el servidor")
      }

      // Hacemos la funcion de elimnar la asignacion
      conexion.query("DELETE FROM asignaciones WHERE id_asignacion = ?", [id], (error, resultado) => {
        if (error) {
          return conexion.rollback(() => {
            console.error("Error al eliminar asignación:", error)
            res.status(500).send("Error en el servidor")
          })
        }

        // Establecemos es estado del equipo a disponible para poder asignarlo a otro usurio
        const actualizacionEquipo = {
          estado: "disponible",
          usuario_actual_id: null,
        }

        conexion.query(
          "UPDATE equipos SET ? WHERE id_equipo = ?",
          [actualizacionEquipo, equipo_id],
          (error, resultado) => {
            if (error) {
              return conexion.rollback(() => {
                console.error("Error al actualizar estado del equipo:", error)
                res.status(500).send("Error en el servidor")
              })
            }

            // confirmamos la transaccion la transacción
            conexion.commit((err) => {
              if (err) {
                return conexion.rollback(() => {
                  console.error("Error al confirmar transacción:", err)
                  res.status(500).send("Error en el servidor")
                })
              }

              return res.redirect("/asignaciones")
            })
          },
        )
      })
    })
  })
}

