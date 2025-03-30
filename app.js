const express = require("express")
const app = express()
const path = require("path")
const session = require("express-session")
const cookieParser = require("cookie-parser")
const flash = require("connect-flash")

// Middleware para analizar el cuerpo de las solicitudes
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Configuración de cookies y sesiones
app.use(cookieParser())
app.use(
  session({
    secret: "sistema-gestion-equipos-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 3600000,
      secure: false,
    },
  }),
)

// Configurar flash para mensajes temporales
app.use(flash())

// Variables globales para las vistas
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null
  res.locals.mensajes = req.flash()
  next()
})

//motor de plantillas
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")))

// Importar rutas
const mainRoutes = require("./routes/index")
const authRoutes = require("./routes/auth")

// Middleware para verificar autenticación
const { verificarAutenticacion, verificarRol } = require("./middlewares/auth")

// Usar las rutas principales
app.use("/", mainRoutes)
app.use("/auth", authRoutes)

//mostrar la seccion actual
app.get("/", (req, res) => {
  res.render("index")
})

app.get("/equipos", (req, res) => {
  res.render("equipos/index")
})



//Seccion de usuarios
app.use(express.urlencoded({ extended: false })) // Corregido "extended"
app.use(express.json()) // Corregido "json()"
app.use("/", require("./routes/usuarios"))

// Rutas protegidas por autenticación (aqui asignamos los roles de cada ruta)
app.use("/usuarios", verificarAutenticacion, verificarRol(["admin"]), require("./routes/usuarios"))
app.use("/equipos", verificarAutenticacion, verificarRol(["admin", "tecnico"]), require("./routes/equipos"))

// Rutas con roles específicos
app.use("/reparaciones", verificarAutenticacion, verificarRol(["admin", "tecnico"]), require("./routes/reparaciones"))
app.use("/asignaciones", verificarAutenticacion, verificarRol(["admin", "tecnico"]), require("./routes/asignaciones"))
//app.use("/bitacoras", verificarAutenticacion, verificarRol(["admin", "tecnico"]), require("./routes/bitacoras"))
//app.use("/reportes", verificarAutenticacion, verificarRol(["admin"]), require("./routes/reportes"))
app.use("/mi-equipo", verificarAutenticacion, verificarRol(["usuario_final"]), require("./routes/mi-equipo"))

// Iniciar el servidor
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})

