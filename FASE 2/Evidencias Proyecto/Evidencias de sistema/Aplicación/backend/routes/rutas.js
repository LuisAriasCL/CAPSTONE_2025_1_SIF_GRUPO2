const express = require('express');
const router = express.Router();
const Ruta = require('../models/Ruta'); // CORREGIDO: Importar el nuevo modelo Ruta

// GET /api/rutas - Obtener TODAS las rutas
router.get('/', async (req, res) => {
    try {
        const rutas = await Ruta.findAll({
            order: [['nombreRuta', 'ASC']] // CORREGIDO: Ordenar por 'nombreRuta'
        });
        // Las rutas ahora tendrán atributos como idRuta, nombreRuta, etc.
        res.status(200).json(rutas);
    } catch (err) {
        console.error("Error al obtener rutas:", err);
        res.status(500).json({ message: 'Error interno del servidor al obtener rutas.' });
    }
});

// POST /api/rutas - Crear una NUEVA ruta
router.post('/', async (req, res) => {
    // CORREGIDO: Desestructurar usando los nuevos nombres de atributos del modelo Ruta
    const { nombreRuta, descripcionRuta, puntosRuta, kilometrosRuta } = req.body;

    // Validación de entrada (ajustada a los nuevos nombres)
    if (!nombreRuta || !puntosRuta) {
        return res.status(400).json({ message: 'Los campos nombreRuta y puntosRuta son requeridos.' });
    }

    // Validación de la estructura de puntosRuta
    if (!Array.isArray(puntosRuta) || !puntosRuta.every(p => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number')) {
        return res.status(400).json({ message: 'El campo puntosRuta debe ser un array de coordenadas (array de arrays de dos números [[lat,lon],...]).' });
    }

    try {
        // CORREGIDO: Usar el modelo Ruta y los nuevos nombres de atributos
        const nuevaRuta = await Ruta.create({
            nombreRuta,
            descripcionRuta,  // Puede ser null si así se define en el modelo
            puntosRuta,       // Debe ser un objeto/array JS que Sequelize serializará a JSON
            kilometrosRuta    // Puede ser null si así se define en el modelo
        });

        // Emitir evento de Socket.IO si req.io está disponible
        if (req.io) {
            req.io.emit('routeCreated', nuevaRuta.toJSON());
            console.log(`Evento Socket.IO emitido: routeCreated para ${nuevaRuta.nombreRuta}`);
        }

        res.status(201).json(nuevaRuta); // Devuelve la ruta creada con atributos en español

    } catch (err) {
        console.error("Error al crear ruta:", err);
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Error de validación.', errors: err.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Error interno del servidor al crear la ruta.' });
    }
});

// GET /api/rutas/:id - Obtener UNA ruta por su ID
router.get('/:idRuta', async (req, res) => { // Cambiado a :idRuta para claridad, pero req.params.idRuta se usará
    try {
        const idRutaParam = parseInt(req.params.idRuta, 10);
        if (isNaN(idRutaParam)) {
            return res.status(400).json({ message: 'El ID de la ruta debe ser un número.' });
        }

        // CORREGIDO: Usar el modelo Ruta. findByPk buscará por la PK definida en el modelo (idRuta).
        const ruta = await Ruta.findByPk(idRutaParam);

        if (!ruta) {
            return res.status(404).json({ message: 'Ruta no encontrada.' });
        }

        res.status(200).json(ruta); // Devuelve la ruta con atributos en español

    } catch (err) {
        console.error(`Error al obtener ruta ${req.params.idRuta}:`, err);
        res.status(500).json({ message: 'Error interno del servidor al obtener la ruta.' });
    }
});

// PUT /api/rutas/:idRuta - Actualizar UNA ruta existente
router.put('/:idRuta', async (req, res) => {
    try {
        const idRutaParam = parseInt(req.params.idRuta, 10);
        if (isNaN(idRutaParam)) {
            return res.status(400).json({ message: 'El ID de la ruta debe ser un número.' });
        }

        const ruta = await Ruta.findByPk(idRutaParam); // CORREGIDO: Usar modelo Ruta
        if (!ruta) {
            return res.status(404).json({ message: 'Ruta no encontrada para actualizar.' });
        }

        // CORREGIDO: El req.body debe contener los atributos del modelo Ruta (camelCase español)
        const { nombreRuta, descripcionRuta, puntosRuta, kilometrosRuta } = req.body;

        // Validación para puntosRuta si se envía para actualizar
        if (puntosRuta !== undefined) {
            if (!Array.isArray(puntosRuta) || !puntosRuta.every(p => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number')) {
                return res.status(400).json({ message: 'Si se proporciona puntosRuta, debe ser un array de coordenadas válido.' });
            }
        }

        // Actualizar la instancia con los nuevos datos.
        // El método 'update' de la instancia solo actualiza los campos que se le pasan.
        // O se pueden asignar directamente y luego usar save().
        await ruta.update({
            nombreRuta,
            descripcionRuta,
            puntosRuta,
            kilometrosRuta
        });
        // Alternativamente, si solo quieres actualizar los campos que vienen en req.body:
        // await ruta.update(req.body); // Esto es más conciso si req.body solo tiene campos válidos del modelo

        if (req.io) {
            req.io.emit('routeUpdated', ruta.toJSON()); // Enviar el objeto ruta actualizado
            console.log(`Evento Socket.IO emitido: routeUpdated para ${ruta.nombreRuta}`);
        }

        res.status(200).json(ruta); // Devolver la ruta actualizada

    } catch (err) {
        console.error(`Error al actualizar ruta ${req.params.idRuta}:`, err);
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Error de validación.', errors: err.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar la ruta.' });
    }
});

// DELETE /api/rutas/:idRuta - Eliminar UNA ruta existente
router.delete('/:idRuta', async (req, res) => {
    try {
        const idRutaParam = parseInt(req.params.idRuta, 10);
        if (isNaN(idRutaParam)) {
            return res.status(400).json({ message: 'El ID de la ruta debe ser un número.' });
        }

        // CORREGIDO: Usar el modelo Ruta y el nombre de su PK 'idRuta' en el where.
        const numeroFilasEliminadas = await Ruta.destroy({
            where: { idRuta: idRutaParam } // La PK en el modelo Ruta es idRuta
        });

        if (numeroFilasEliminadas === 0) {
            return res.status(404).json({ message: 'Ruta no encontrada para eliminar.' });
        }

        if (req.io) {
            req.io.emit('routeDeleted', { id: idRutaParam });
            console.log(`Evento Socket.IO emitido: routeDeleted para ID ${idRutaParam}`);
        }

        res.status(200).json({ message: 'Ruta eliminada exitosamente.' });

    } catch (err) {
        console.error(`Error al eliminar ruta ${req.params.idRuta}:`, err);
        res.status(500).json({ message: 'Error interno del servidor al eliminar la ruta.' });
    }
});

module.exports = router;