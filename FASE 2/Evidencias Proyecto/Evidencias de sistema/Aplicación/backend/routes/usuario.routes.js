// backend/routes/usuario.routes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// GET /api/usuarios
// GET /api/usuarios?rol=tecnico
router.get('/', usuarioController.getUsuarios);

module.exports = router;