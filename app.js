const express = require("express")
const app = express()
const path = require("path")
const session = require("express-session")
const cookieParser = require("cookie-parser")
const flash = require("connect-flash")

// Middleware para analizar el cuerpo de las solicitudes
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Configuración de cookies y sesiones con mayor duración (1 semana)
app.use(cookieParser())
app.use(
  session({
    secret: "sistema-gestion-equipos-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 semana en milisegundos
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

// Middleware para verificar autenticación
const { verificarAutenticacion, verificarRol } = require("./middlewares/auth")

// Ruta principal - redirigir al login si no hay sesión
app.get("/", (req, res) => {
  if (!req.session.usuario) {
    return res.redirect("/auth/login")
  }
  res.render("index")
})

// Importar rutas
const authRoutes = require("./routes/auth")
const usuariosRoutes = require("./routes/usuarios")
const equiposRoutes = require("./routes/equipos")
const reparacionesRoutes = require("./routes/reparaciones")
const asignacionesRoutes = require("./routes/asignaciones")
const miEquipoRoutes = require("./routes/mi-equipo")

// Usar las rutas principales
app.use("/auth", authRoutes)

// Rutas protegidas por autenticación
app.use("/usuarios", verificarAutenticacion, verificarRol(["admin"]), usuariosRoutes)
app.use("/equipos", verificarAutenticacion, verificarRol(["admin", "tecnico"]), equiposRoutes)
app.use("/reparaciones", verificarAutenticacion, verificarRol(["admin", "tecnico"]), reparacionesRoutes)
app.use("/asignaciones", verificarAutenticacion, verificarRol(["admin", "tecnico"]), asignacionesRoutes)
app.use("/mi-equipo", verificarAutenticacion, verificarRol(["usuario_final"]), miEquipoRoutes)

// Iniciar el servidor
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})

