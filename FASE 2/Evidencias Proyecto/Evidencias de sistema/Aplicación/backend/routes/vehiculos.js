// backend/routes/vehiculos.js
const express = require('express');
const router = express.Router();
// Importa vehiculoController solo si getHistorialByVehiculoId se mantiene aquí
const vehiculoController = require('../controllers/vehiculoController'); 

// Importa db y extrae modelos, sequelize y Op
const db = require('../models');
const Vehiculo = db.Vehiculo;
const OrdenTrabajo = db.OrdenTrabajo;
const Siniestro = db.Siniestro;
const RegistroCombustible = db.RegistroCombustible;
const AsignacionRecorrido = db.AsignacionRecorrido;
const sequelize = db.sequelize;
const Op = db.Sequelize.Op; // Importa Op desde db.Sequelize.Op

// Ruta para historial (llama a vehiculoController si aún lo necesitas)
router.get('/:id/historial', vehiculoController.getHistorialByVehiculoId);

// GET /api/vehicles - Obtener TODOS los vehículos
router.get('/', async (req, res) => {
    try {
        const estadoFilter = req.query.estado;
        let whereClause = {};
        if (estadoFilter) {
            if (Array.isArray(estadoFilter)) {
                whereClause.estadoVehi = { [Op.in]: estadoFilter };
            } else {
                whereClause.estadoVehi = estadoFilter;
            }
        }
        
        const vehiculos = await Vehiculo.findAll({
            where: whereClause,
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

// PUT /api/vehicles/:idVehi - Actualizar UN vehículo existente
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

// CAMBIO CRÍTICO: Eliminar UN vehículo existente (Lógica movida directamente aquí)
router.delete('/:idVehi', async (req, res) => {
    const t = await sequelize.transaction(); // Iniciar una transacción
    try {
        const idVehiParam = req.params.idVehi; 
        const id = parseInt(idVehiParam, 10);

        console.log(`[VehiculosRoutes - DELETE] Recibiendo ID para eliminar: ${idVehiParam}, Parseado a: ${id}`);

        if (isNaN(id)) {
            await t.rollback();
            console.log(`[VehiculosRoutes - DELETE] Error: ID de vehículo no válido: ${idVehiParam}`);
            return res.status(400).json({ message: 'El ID del vehículo debe ser un número válido.' });
        }

        const vehiculo = await Vehiculo.findByPk(id, { transaction: t }); 
        console.log(`[VehiculosRoutes - DELETE] Resultado findByPk para ID ${id}:`, vehiculo ? 'Encontrado' : 'No encontrado');

        if (!vehiculo) {
            await t.rollback();
            console.log(`[VehiculosRoutes - DELETE] Vehículo con ID ${id} no encontrado.`);
            return res.status(404).json({ message: 'Vehículo no encontrado.' });
        }

        // --- VERIFICAR RELACIONES ACTIVAS ANTES DE ELIMINAR ---

        // 1. Verificar asignaciones de recorrido activas
        const asignacionActiva = await AsignacionRecorrido.findOne({ 
            where: {
                vehiculoIdVehi: id,
                estadoAsig: { [Op.notIn]: ['completado', 'cancelado'] } 
            },
            transaction: t
        });
        if (asignacionActiva) {
            await t.rollback();
            console.log(`[VehiculosRoutes - DELETE] Conflicto: Vehículo ID ${id} tiene asignación activa (ID: ${asignacionActiva.idAsig}).`);
            return res.status(409).json({ message: 'No se puede eliminar el vehículo: Tiene asignaciones de recorrido activas.' });
        }

        // 2. Verificar Órdenes de Trabajo pendientes/activas
        const otActiva = await OrdenTrabajo.findOne({
            where: {
                vehiculoIdVehi: id,
                estado_ot: { [Op.notIn]: ['completada', 'cancelada'] } 
            },
            transaction: t
        });
        if (otActiva) {
            await t.rollback();
            console.log(`[VehiculosRoutes - DELETE] Conflicto: Vehículo ID ${id} está en una Orden de Trabajo activa (ID: ${otActiva.id_ot}).`);
            return res.status(409).json({ message: 'No se puede eliminar el vehículo: Está involucrado en órdenes de trabajo pendientes.' });
        }

        // 3. Verificar Siniestros pendientes/activos 
        const siniestroActivo = await Siniestro.findOne({
            where: {
                vehiculoId: id, // CAMBIO CLAVE AQUÍ: usar vehiculoId
                estado: { [Op.notIn]: ['resuelto', 'cancelado'] } 
            },
            transaction: t
        });
        if (siniestroActivo) {
            await t.rollback();
            console.log(`[VehiculosRoutes - DELETE] Conflicto: Vehículo ID ${id} tiene un siniestro activo (ID: ${siniestroActivo.id}).`);
            return res.status(409).json({ message: 'No se puede eliminar el vehículo: Tiene siniestros pendientes de resolución.' });
        }

        // --- SI NO HAY CONFLICTOS, PROCEDER A ELIMINAR ---
        await vehiculo.destroy({ transaction: t });

        await t.commit(); 
        console.log(`[VehiculosRoutes - DELETE] Vehículo ID ${id} eliminado exitosamente.`);
        res.status(200).json({ message: 'Vehículo eliminado exitosamente.' });

    } catch (error) {
        await t.rollback(); 
        console.error('[VehiculosRoutes - DELETE] Error al eliminar vehículo (general catch):', error);

        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({ message: 'No se puede eliminar el vehículo: Está relacionado con otros registros activos en la base de datos.' });
        }

        res.status(500).json({ message: 'Error interno del servidor al eliminar el vehículo.', error: error.message });
    }
});

module.exports = router;
