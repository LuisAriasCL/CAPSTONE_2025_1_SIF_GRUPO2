// backend/routes/ordenTrabajo.routes.js

const express = require('express');
const router = express.Router();
const ordenTrabajoController = require('../controllers/ordenTrabajoController');

// --- RUTAS PARA ÓRDENES DE TRABAJO ---

// POST /api/ordenes-trabajo/generar
// Esta es la ruta que tu frontend está buscando.
// La cambiamos de '/generar-desde-plan' a '/generar'.
router.post('/generar', ordenTrabajoController.generarOtDesdePlan);

// GET /api/ordenes-trabajo/
// Obtiene una lista de todas las OTs.
router.get('/', ordenTrabajoController.listarOrdenesTrabajo);

// GET /api/ordenes-trabajo/:id
// Obtiene una OT específica por su ID.
router.get('/:id', ordenTrabajoController.getOrdenTrabajoPorId);

// PUT /api/ordenes-trabajo/:id/detalles
// Actualiza los detalles de las tareas de una OT.
router.put('/:id/detalles', ordenTrabajoController.actualizarDetallesOt);

// PUT /api/ordenes-trabajo/:id/estado
// Actualiza el estado general de una OT.
router.put('/:id/estado', ordenTrabajoController.actualizarEstadoOt);

module.exports = router;