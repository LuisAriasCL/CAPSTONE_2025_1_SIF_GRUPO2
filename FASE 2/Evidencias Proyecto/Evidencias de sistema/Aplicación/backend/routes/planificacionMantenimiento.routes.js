// backend/routes/planificacionMantenimiento.routes.js
const express = require('express');
const router = express.Router();
const planificacionController = require('../controllers/planificacionMantenimientoController');
// const { checkAuth, checkRole } = require('../middleware/authMiddleware'); // Descomenta si tienes middleware de autenticación/roles

// Ruta para crear una nueva planificación de mantenimiento
// Ejemplo con middleware: router.post('/', checkAuth, checkRole(['Encargado de Mantenimiento', 'Administrador']), planificacionController.crearPlanificacion);
router.post('/', planificacionController.crearPlanificacion);

// Ruta para listar todas las planificaciones de mantenimiento
// Ejemplo con middleware: router.get('/', checkAuth, planificacionController.listarPlanificaciones);
router.get('/', planificacionController.listarPlanificaciones);

// (Aquí irán más rutas para GET por ID, PUT, DELETE más adelante)

module.exports = router;