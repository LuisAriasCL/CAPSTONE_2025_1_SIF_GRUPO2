// backend/routes/ordenTrabajo.routes.js
const express = require('express');
const router = express.Router();
const ordenTrabajoController = require('../controllers/ordenTrabajoController');

// --- DEFINICIÓN DE RUTAS PARA ÓRDENES DE TRABAJO ---

// POST /api/ordenes-trabajo/generar
// Ruta para generar una nueva Orden de Trabajo a partir de una planificación.
router.post('/generar', ordenTrabajoController.generarOtDesdePlan);

// GET /api/ordenes-trabajo
// Ruta para listar todas las órdenes de trabajo.
router.get('/', ordenTrabajoController.listarOrdenesTrabajo);

// GET /api/ordenes-trabajo/:id
// Ruta para obtener el detalle de una orden de trabajo específica.
router.get('/:id', ordenTrabajoController.getOrdenTrabajoPorId);

// POST /api/ordenes-trabajo/asignar-tecnico
// Ruta para asignar un técnico a una tarea (detalle de OT).
router.put('/detalles', ordenTrabajoController.actualizarDetallesOt);

module.exports = router;