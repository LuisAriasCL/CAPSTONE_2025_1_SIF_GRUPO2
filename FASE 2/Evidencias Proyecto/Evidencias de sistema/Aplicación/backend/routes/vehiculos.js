// backend/routes/vehiculos.js
const express = require('express');
const router = express.Router();
const vehiculoController = require('../controllers/vehiculoController');

const { Vehiculo, sequelize } = require('../models'); // Importa desde el index.js de la carpeta models

router.get('/:id/historial', vehiculoController.getHistorialByVehiculoId);
router.get('/', async (req, res) => {
    try {
   
        const vehiculos = await Vehiculo.findAll({
            order: [['marca', 'ASC'], ['modelo', 'ASC']]
        });
        res.status(200).json(vehiculos);
    } catch (err) {
        console.error("Error al obtener vehículos:", err);
        res.status(500).json({ message: 'Error interno del servidor al obtener vehículos.' });
    }
});

// GET /api/vehicles/:idVehi - Obtener UN vehículo por su ID
router.get('/:idVehi', async (req, res) => {
    try {
        const idVehiParam = parseInt(req.params.idVehi, 10);
        if (isNaN(idVehiParam)) {
            return res.status(400).json({ message: 'El ID del vehículo debe ser un número.' });
        }
        const vehiculo = await Vehiculo.findByPk(idVehiParam);
        if (!vehiculo) {
            return res.status(404).json({ message: 'Vehículo no encontrado.' });
        }
        res.status(200).json(vehiculo);
    } catch (err) {
        console.error(`Error al obtener vehículo ${req.params.idVehi}:`, err);
        res.status(500).json({ message: 'Error interno del servidor al obtener el vehículo.' });
    }
});

// POST /api/vehicles - Crear un NUEVO vehículo
router.post('/', async (req, res) => {
    try {
       
        const nuevoVehiculo = await Vehiculo.create(req.body);

        if (req.io) { 
            req.io.emit('vehicleCreated', nuevoVehiculo.toJSON());
        }
        res.status(201).json(nuevoVehiculo);
    } catch (err) {
        console.error("Error al crear vehículo:", err);
        if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Error de validación o restricción.', errors: err.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Error interno del servidor al crear el vehículo.' });
    }
});


router.put('/:idVehi', async (req, res) => {
    try {
        const idVehiParam = parseInt(req.params.idVehi, 10);
        if (isNaN(idVehiParam)) {
            return res.status(400).json({ message: 'El ID del vehículo debe ser un número.' });
        }
        const vehiculo = await Vehiculo.findByPk(idVehiParam);
        if (!vehiculo) {
            return res.status(404).json({ message: 'Vehículo no encontrado para actualizar.' });
        }
        await vehiculo.update(req.body);

        if (req.io) {
            req.io.emit('vehicleUpdated', vehiculo.toJSON());
        }
        res.status(200).json(vehiculo);
    } catch (err) {
        console.error(`Error al actualizar vehículo ${req.params.idVehi}:`, err);
        if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Error de validación o restricción.', errors: err.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar el vehículo.' });
    }
});

// DELETE /api/vehicles/:idVehi - Eliminar UN vehículo existente
router.delete('/:idVehi', async (req, res) => {
    try {
        const idVehiParam = parseInt(req.params.idVehi, 10);
        if (isNaN(idVehiParam)) {
            return res.status(400).json({ message: 'El ID del vehículo debe ser un número.' });
        }
        const numeroFilasEliminadas = await Vehiculo.destroy({
            where: { idVehi: idVehiParam }
        });
        if (numeroFilasEliminadas === 0) {
            return res.status(404).json({ message: 'Vehículo no encontrado para eliminar.' });
        }
        if (req.io) {
            req.io.emit('vehicleDeleted', { id: idVehiParam });
        }
        res.status(200).json({ message: 'Vehículo eliminado exitosamente.' });
    } catch (err) {
        console.error(`Error al eliminar vehículo ${req.params.idVehi}:`, err);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el vehículo.' });
    }
});

module.exports = router;