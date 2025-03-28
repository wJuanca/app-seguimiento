const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/equipos", (req, res) => {
  res.redirect("/equipos");
});

module.exports = router;
