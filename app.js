const express = require("express");
const app = express();
const path = require("path");

// Middleware para analizar el cuerpo de las solicitudes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//motor de plantillas
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Importar rutas
const mainRoutes = require("./routes/index");

// Usar las rutas principales
app.use("/", mainRoutes);




//mostrar la seccion actual
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/equipos', (req, res) => {
  res.render('equipos/index');
});




// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});