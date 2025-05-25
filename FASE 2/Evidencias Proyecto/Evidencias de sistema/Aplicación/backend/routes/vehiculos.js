// backend/routes/vehiculos.js
const express = require('express');
const Vehiculo = require('../models/Vehiculo'); // Importamos el nuevo modelo Vehiculo.js

const router = express.Router();

// GET /api/vehicles - Obtener TODOS los vehículos
router.get('/', async (req, res) => {
    try {
        const vehiculos = await Vehiculo.findAll({
            order: [['patente', 'ASC']] // Ordenamos por 'patente' ya que 'name' no existe en Vehiculo.js
        });
        res.status(200).json(vehiculos); // Atributos en camelCase español
    } catch (err) {
        console.error("Error al obtener vehículos:", err);
        res.status(500).json({ message: 'Error interno del servidor al obtener vehículos.' });
    }
});

// POST /api/vehicles - Crear un NUEVO vehículo
router.post('/', async (req, res) => {
    // Desestructuramos según los atributos EXACTOS del modelo Vehiculo.js
    const {
        patente,
        chasis,
        tipoVehi,
        estadoVehi,
        tipoCombVehi,
        kmVehi,
        marca,
        modelo,
        anio,
        kmVidaUtil,
        efiComb,
        fecAdqui, // Campo requerido
        latitud,
        longitud
    } = req.body;

    // Validación de campos requeridos según el modelo Vehiculo.js
    // (patente, chasis, estadoVehi, kmVehi, marca, modelo, anio, fecAdqui son allowNull: false)
    if (!patente || !chasis || !marca || !modelo || !anio || !fecAdqui) {
        return res.status(400).json({
            message: 'Los campos patente, chasis, marca, modelo, anio y fecAdqui son requeridos.'
        });
    }

    try {
        const nuevoVehiculo = await Vehiculo.create({
            patente,
            chasis,
            tipoVehi,     // Puede ser null si allowNull: true
            estadoVehi,   // Tiene defaultValue: 'activo'
            tipoCombVehi, // Puede ser null si allowNull: true
            kmVehi,       // Tiene defaultValue: 0
            marca,
            modelo,
            anio,
            kmVidaUtil,   // Puede ser null
            efiComb,      // Puede ser null
            fecAdqui,
            latitud,      // Puede ser null
            longitud      // Puede ser null
        });

        req.io.emit('vehicleCreated', nuevoVehiculo.toJSON());
        console.log(`Evento Socket.IO emitido: vehicleCreated para patente ${nuevoVehiculo.patente}`);

        res.status(201).json(nuevoVehiculo);

    } catch (err) {
        console.error("Error al crear vehículo:", err.message, err.errors);
        if (err.name === 'SequelizeUniqueConstraintError') {
            let campoDuplicado = 'desconocido';
            if (err.errors && err.errors.length > 0) {
                // Sequelize usa el nombre del atributo del modelo (camelCase) en err.errors[0].path
                // para los campos unique:true en el modelo.
                campoDuplicado = err.errors[0].path; // ej. 'patente' o 'chasis'
            }
            return res.status(409).json({
                message: `El campo '${campoDuplicado}' con valor '${req.body[campoDuplicado]}' ya está registrado.`
            });
        }
        res.status(500).json({ message: 'Error interno del servidor al crear el vehículo.' });
    }
});

// GET /api/vehicles/:id - Obtener UN vehículo por su ID
router.get('/:id', async (req, res) => {
    try {
        const idVehiculo = parseInt(req.params.id, 10);
        if (isNaN(idVehiculo)) {
            return res.status(400).json({ message: 'El ID del vehículo debe ser un número.' });
        }

        const vehiculo = await Vehiculo.findByPk(idVehiculo); // findByPk usa la PK definida en el modelo (idVehi)

        if (!vehiculo) {
            return res.status(404).json({ message: 'Vehículo no encontrado.' });
        }

        res.status(200).json(vehiculo);

    } catch (err) {
        console.error(`Error al obtener vehículo ${req.params.id}:`, err);
        res.status(500).json({ message: 'Error interno del servidor al obtener el vehículo.' });
    }
});

// PUT /api/vehicles/:id - Actualizar UN vehículo existente
router.put('/:id', async (req, res) => {
    try {
        const idVehiculo = parseInt(req.params.id, 10);
        if (isNaN(idVehiculo)) {
            return res.status(400).json({ message: 'El ID del vehículo debe ser un número.' });
        }

        const vehiculo = await Vehiculo.findByPk(idVehiculo);
        if (!vehiculo) {
            return res.status(404).json({ message: 'Vehículo no encontrado para actualizar.' });
        }

        // Se espera que req.body contenga los atributos del modelo Vehiculo.js (camelCase español)
        // Ejemplo: { "kmVehi": 150000, "estadoVehi": "mantenimiento" }
        // Los campos no presentes en req.body no se actualizarán.
        // Los campos definidos como unique (patente, chasis) lanzarán error si se duplican.
        await vehiculo.update(req.body);

        req.io.emit('vehicleUpdated', vehiculo.toJSON());
        console.log(`Evento Socket.IO emitido: vehicleUpdated para patente ${vehiculo.patente}`);

        res.status(200).json(vehiculo);

    } catch (err) {
        console.error(`Error al actualizar vehículo ${req.params.id}:`, err);
        if (err.name === 'SequelizeUniqueConstraintError') {
            let campoDuplicado = 'desconocido';
            let valorDuplicado = '';
             if (err.errors && err.errors.length > 0) {
                 campoDuplicado = err.errors[0].path; // ej. 'patente' o 'chasis'
                 // Intentamos obtener el valor del body; si no está, del error (aunque value en error puede ser el de la BD)
                 valorDuplicado = req.body[campoDuplicado] !== undefined ? req.body[campoDuplicado] : err.errors[0].value;
             }
            return res.status(409).json({
                message: `El campo '${campoDuplicado}' con valor '${valorDuplicado}' ya está registrado en otro vehículo.`
            });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar el vehículo.' });
    }
});

// DELETE /api/vehicles/:id - Eliminar UN vehículo existente
router.delete('/:id', async (req, res) => {
    try {
        const idVehiculo = parseInt(req.params.id, 10);
        if (isNaN(idVehiculo)) {
            return res.status(400).json({ message: 'El ID del vehículo debe ser un número.' });
        }

        const deletedRowCount = await Vehiculo.destroy({
            where: { idVehi: idVehiculo } // Usamos el atributo PK del modelo Vehiculo (idVehi)
        });

        if (deletedRowCount === 0) {
            return res.status(404).json({ message: 'Vehículo no encontrado para eliminar.' });
        }

        req.io.emit('vehicleDeleted', { id: idVehiculo });
        console.log(`Evento Socket.IO emitido: vehicleDeleted para ID ${idVehiculo}`);

        res.status(200).json({ message: 'Vehículo eliminado exitosamente.' });

    } catch (err) {
        console.error(`Error al eliminar vehículo ${req.params.id}:`, err);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el vehículo.' });
    }
});

module.exports = router;