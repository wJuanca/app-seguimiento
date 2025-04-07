const db = require("../database/db")

// mostrar todos los equipos que se encuentran en la base de datos
exports.mostrarEquipos = (req, res) => {
  // parametros de filtrado
  const { busqueda, tipo, marca, estado } = req.query

  // consulta para la tabla de equipos
  let sql = `
        SELECT e.*, u.nombre AS usuario_actual 
        FROM equipos e 
        LEFT JOIN usuarios u ON e.usuario_actual_id = u.id_usuario
    `

  const params = []
  const condiciones = []

  // agregar condiciones por filtro
  if (busqueda) {
    condiciones.push("(e.nombre LIKE ? OR e.modelo LIKE ? OR e.numero_serie LIKE ?)")
    const termino = `%${busqueda}%`
    params.push(termino, termino, termino)
  }

  if (tipo) {
    condiciones.push("e.tipo = ?")
    params.push(tipo)
  }

  if (marca) {
    condiciones.push("e.marca = ?")
    params.push(marca)
  }

  if (estado) {
    condiciones.push("e.estado = ?")
    params.push(estado)
  }

  // usar la consulta aplicando las condiciones
  if (condiciones.length > 0) {
    sql += " WHERE " + condiciones.join(" AND ")
  }

  // filtro por marca unica
  db.query("SELECT DISTINCT marca FROM equipos ORDER BY marca", (err, marcasResultado) => {
    if (err) {
      console.error("Error al obtener marcas:", err)
      res.status(500).send("Error al obtener datos")
      return
    }

    // nombre en array
    const marcas = marcasResultado.map((row) => row.marca)

    //consulta principal con filtros
    db.query(sql, params, (err, resultados) => {
      if (err) {
        console.error("Error al obtener equipos:", err)
        res.status(500).send("Error al obtener equipos")
        return
      }

      // renderizar la vista con los datos filtrados
      res.render("equipos/index", {
        equipos: resultados,
        marcas: marcas,
        filtros: { busqueda, tipo, marca, estado },
      })
    })
  })
}

// formulario para crear un nuevo equipo
exports.formCrearEquipo = (req, res) => {
  res.render("equipos/crear")
}

// guardar un equipo en la base de datos
exports.crearEquipo = (req, res) => {
  const { nombre, tipo, marca, modelo, numero_serie } = req.body

  // Siempre establecer el estado como 'disponible' al crear
  const estado = "disponible"

  db.query(
    "INSERT INTO equipos (nombre, tipo, marca, modelo, numero_serie, estado) VALUES (?, ?, ?, ?, ?, ?)",
    [nombre, tipo, marca, modelo, numero_serie, estado],
    (err, result) => {
      if (err) {
        console.error("Error al crear equipo:", err)
        res.status(500).send("Error al crear equipo")
        return
      }
      res.redirect("/equipos")
    },
  )
}

// form para editar el equipo
exports.formEditarEquipo = (req, res) => {
  const query = `
        SELECT e.*, u.nombre AS usuario_actual 
        FROM equipos e 
        LEFT JOIN usuarios u ON e.usuario_actual_id = u.id_usuario 
        WHERE e.id_equipo = ?
    `

  db.query(query, [req.params.id], (err, resultado) => {
    if (err) {
      console.error("Error al obtener equipo para editar:", err)
      res.status(500).send("Error al obtener equipo para editar")
      return
    }

    if (resultado.length === 0) {
      res.status(404).render("404")
      return
    }

    res.render("equipos/editar", { equipo: resultado[0] })
  })
}

// ver detalles de un equipo (vista de solo lectura)
exports.verEquipo = (req, res) => {
  const query = `
        SELECT e.*, u.nombre AS usuario_actual 
        FROM equipos e 
        LEFT JOIN usuarios u ON e.usuario_actual_id = u.id_usuario 
        WHERE e.id_equipo = ?
    `

  db.query(query, [req.params.id], (err, resultado) => {
    if (err) {
      console.error("Error al obtener equipo:", err)
      res.status(500).send("Error al obtener equipo")
      return
    }

    if (resultado.length === 0) {
      res.status(404).render("404")
      return
    }

    // Obtener historial de reparaciones
    const reparacionesQuery = `
      SELECT r.*, t.nombre AS nombre_tecnico
      FROM reparaciones r
      LEFT JOIN usuarios t ON r.tecnico_id = t.id_usuario
      WHERE r.equipo_id = ?
      ORDER BY r.fecha_inicio DESC
    `

    db.query(reparacionesQuery, [req.params.id], (err, reparaciones) => {
      if (err) {
        console.error("Error al obtener historial de reparaciones:", err)
        return res.render("equipos/ver", { equipo: resultado[0], reparaciones: [] })
      }

      res.render("equipos/ver", {
        equipo: resultado[0],
        reparaciones: reparaciones,
      })
    })
  })
}

// Guardar los cambios del equipo en la base de datos
exports.editarEquipo = (req, res) => {
  const { nombre, tipo, marca, modelo, numero_serie, estado } = req.body

  // Solo actualizamos los campos que el usuario puede editar
  db.query(
    "UPDATE equipos SET nombre = ?, tipo = ?, marca = ?, modelo = ?, numero_serie = ? WHERE id_equipo = ?",
    [nombre, tipo, marca, modelo, numero_serie, req.params.id],
    (err, result) => {
      if (err) {
        console.error("Error al actualizar equipo:", err)
        res.status(500).send("Error al actualizar equipo")
        return
      }
      res.redirect("/equipos")
    },
  )
}

// eliminar un equipo de la base de datos definitivamente
exports.eliminarEquipo = (req, res) => {
  db.query("DELETE FROM equipos WHERE id_equipo = ?", [req.params.id], (err, result) => {
    if (err) {
      console.error("Error al eliminar equipo:", err)
      res.status(500).send("Error al eliminar equipo")
      return
    }
    res.redirect("/equipos")
  })
}

