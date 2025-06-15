// backend/routes/ordenTrabajo.routes.js

const express = require('express');
const router = express.Router();
const ordenTrabajoController = require('../controllers/ordenTrabajoController');


router.post('/generar', ordenTrabajoController.generarOtDesdePlan);


router.get('/', ordenTrabajoController.listarOrdenesTrabajo);


router.get('/:id', ordenTrabajoController.getOrdenTrabajoPorId);


router.put('/:id/detalles', ordenTrabajoController.actualizarDetallesOt);


router.put('/:id/estado', ordenTrabajoController.actualizarEstadoOt);
router.get('/tecnico/:tecnicoId', ordenTrabajoController.getOrdenesPorTecnico);
module.exports = router;