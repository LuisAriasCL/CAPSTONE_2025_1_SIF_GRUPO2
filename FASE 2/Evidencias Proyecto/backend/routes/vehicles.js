// backend/routes/vehicles.js

const express = require('express');
const Vehicle = require('../models/Vehicle');

const router = express.Router();

// GET /api/vehicles - Obtener TODOS los vehículos
router.get('/', async (req, res) => {
    try {
        const vehicles = await Vehicle.findAll({
            order: [['name', 'ASC']]
        });
        res.status(200).json(vehicles);
    } catch (err) {
        console.error("Error al obtener vehículos:", err);
        res.status(500).json({ message: 'Error interno del servidor al obtener vehículos.' });
    }
});

// POST /api/vehicles - Crear un NUEVO vehículo
router.post('/', async (req, res) => {
    const { name, plate, latitude, longitude, status } = req.body;

    if (!name || !plate) {
        return res.status(400).json({ message: 'Los campos nombre y matrícula son requeridos.' });
    }

    try {
        const newVehicle = await Vehicle.create({
            name,
            plate,
            latitude,
            longitude,
            status
        });

        req.io.emit('vehicleCreated', newVehicle.toJSON());
        console.log(`Evento Socket.IO emitido: vehicleCreated para ${newVehicle.name}`);

        res.status(201).json(newVehicle);

    } catch (err) {
        console.error("Error al crear vehículo:", err);
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                message: `La matrícula '${plate}' ya está registrada.`
            });
        }
        res.status(500).json({ message: 'Error interno del servidor al crear el vehículo.' });
    }
});

// GET /api/vehicles/:id - Obtener UN vehículo por su ID
router.get('/:id', async (req, res) => {
    try {
        const vehicleId = parseInt(req.params.id, 10);
        if (isNaN(vehicleId)) {
            return res.status(400).json({ message: 'El ID del vehículo debe ser un número.' });
        }

        const vehicle = await Vehicle.findByPk(vehicleId);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehículo no encontrado.' });
        }

        res.status(200).json(vehicle);

    } catch (err) {
        console.error(`Error al obtener vehículo ${req.params.id}:`, err);
        res.status(500).json({ message: 'Error interno del servidor al obtener el vehículo.' });
    }
});

// PUT /api/vehicles/:id - Actualizar UN vehículo existente
router.put('/:id', async (req, res) => {
    try {
        const vehicleId = parseInt(req.params.id, 10);
        if (isNaN(vehicleId)) {
            return res.status(400).json({ message: 'El ID del vehículo debe ser un número.' });
        }

        const vehicle = await Vehicle.findByPk(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehículo no encontrado para actualizar.' });
        }

        await vehicle.update(req.body);

        req.io.emit('vehicleUpdated', vehicle.toJSON());
        console.log(`Evento Socket.IO emitido: vehicleUpdated para ${vehicle.name}`);

        res.status(200).json(vehicle);

    } catch (err) {
        console.error(`Error al actualizar vehículo ${req.params.id}:`, err);
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                message: `La matrícula '${req.body.plate}' ya está registrada en otro vehículo.`
            });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar el vehículo.' });
    }
});

// DELETE /api/vehicles/:id - Eliminar UN vehículo existente
router.delete('/:id', async (req, res) => {
    try {
        const vehicleId = parseInt(req.params.id, 10);
        if (isNaN(vehicleId)) {
            return res.status(400).json({ message: 'El ID del vehículo debe ser un número.' });
        }

        const deletedRowCount = await Vehicle.destroy({
            where: { id: vehicleId }
        });

        if (deletedRowCount === 0) {
            return res.status(404).json({ message: 'Vehículo no encontrado para eliminar.' });
        }

        req.io.emit('vehicleDeleted', { id: vehicleId });
        console.log(`Evento Socket.IO emitido: vehicleDeleted para ID ${vehicleId}`);

        res.status(200).json({ message: 'Vehículo eliminado exitosamente.' });

    } catch (err) {
        console.error(`Error al eliminar vehículo ${req.params.id}:`, err);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el vehículo.' });
    }
});

module.exports = router;
