
const express = require('express');
const Route = require('../models/Route'); 
const router = express.Router();


// --- Crear una Nueva Ruta ---
// POST /api/rutas
router.post('/', async (req, res) => {
    // Extraemos los campos en español del body
    const { nombre, descripcion, puntos } = req.body;

    // --- Validación de Entrada ---
    if (!nombre || !puntos) {
        return res.status(400).json({ message: 'El nombre y los puntos son requeridos.' });
    }

    // Validar que 'puntos' sea un array
    if (!Array.isArray(puntos)) {
         return res.status(400).json({ message: 'El campo "puntos" debe ser un array.' });
    }

    // Validar que 'puntos' no esté vacío y que cada punto sea un array de 2 números
    let puntosValidos = true;
    if (puntos.length === 0) {
        puntosValidos = false;
    } else {
        for (const punto of puntos) {
            if (!Array.isArray(punto) || punto.length !== 2 || typeof punto[0] !== 'number' || typeof punto[1] !== 'number') {
                puntosValidos = false;
                break; // Salir del bucle si se encuentra un punto inválido
            }
        }
    }

    if (!puntosValidos) {
         return res.status(400).json({ message: 'El campo "puntos" debe ser un array de arrays, donde cada sub-array contiene exactamente dos números [latitud, longitud].' });
    }
    // --- Fin Validación ---


    try {
       
        const nuevaRuta = await Route.create({
            nombre: nombre,
            descripcion: descripcion, 
            puntos: puntos 
        });

        res.status(201).json(nuevaRuta); // Devolver la ruta creada

    } catch (error) {
        console.error("Error al crear ruta:", error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Error de validación.', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Error interno del servidor al crear la ruta.' });
    }
});



// --- Obtener Todas las Rutas ---
// GET /api/rutas
router.get('/', async (req, res) => {
    try {
        // Buscar todas las rutas, ordenadas por nombre
        const rutas = await Route.findAll({
            order: [['nombre', 'ASC']] // Ordenar por el campo 'nombre'
        });
        res.status(200).json(rutas); // Devolver el array de rutas
    } catch (error) {
        console.error("Error al obtener rutas:", error);
        res.status(500).json({ message: 'Error interno del servidor al obtener las rutas.' });
    }
});


// --- NUEVO: Obtener UNA Ruta por ID ---
// GET /api/rutas/:id
router.get('/:id', async (req, res) => {
    try {
        const idRuta = parseInt(req.params.id, 10);
        if (isNaN(idRuta)) {
            return res.status(400).json({ message: 'El ID de la ruta debe ser un número.' });
        }

        // Buscar por clave primaria
        const ruta = await Route.findByPk(idRuta);

        if (!ruta) {
            return res.status(404).json({ message: 'Ruta no encontrada.' });
        }
        res.status(200).json(ruta); // Devolver la ruta encontrada

    } catch (error) {
        console.error(`Error al obtener ruta ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor al obtener la ruta.' });
    }
});

// --- NUEVO: Actualizar UNA Ruta por ID ---
// PUT /api/rutas/:id
router.put('/:id', async (req, res) => {
    try {
        const idRuta = parseInt(req.params.id, 10);
        if (isNaN(idRuta)) {
            return res.status(400).json({ message: 'El ID de la ruta debe ser un número.' });
        }

        // Extraer datos (solo los que pueden cambiar)
        const { nombre, descripcion, puntos } = req.body;

        // Validación opcional de 'puntos' si se envían para actualizar
        if (puntos !== undefined) { // Solo validar si 'puntos' viene en el body
             if (!Array.isArray(puntos)) {
                return res.status(400).json({ message: 'Si se envía "puntos", debe ser un array.' });
             }
             // Añadir aquí la validación detallada de la estructura de puntos (como en el POST) si es necesario
             // ... (código de validación de puntos) ...
        }

        // Buscar la ruta existente
        const ruta = await Route.findByPk(idRuta);
        if (!ruta) {
            return res.status(404).json({ message: 'Ruta no encontrada para actualizar.' });
        }

        // Actualizar la instancia encontrada con los nuevos datos
        // .update solo actualiza los campos que vienen en el objeto req.body
        await ruta.update({ nombre, descripcion, puntos });

        res.status(200).json(ruta); // Devolver la ruta actualizada

    } catch (error) {
        console.error(`Error al actualizar ruta ${req.params.id}:`, error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Error de validación.', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar la ruta.' });
    }
});

// --- NUEVO: Eliminar UNA Ruta por ID ---
// DELETE /api/rutas/:id
router.delete('/:id', async (req, res) => {
    try {
        const idRuta = parseInt(req.params.id, 10);
        if (isNaN(idRuta)) {
            return res.status(400).json({ message: 'El ID de la ruta debe ser un número.' });
        }

        // Intentar eliminar usando destroy con 'where'
        const numeroFilasEliminadas = await Route.destroy({
            where: { id: idRuta }
        });

        // destroy devuelve el número de filas afectadas
        if (numeroFilasEliminadas === 0) {
            return res.status(404).json({ message: 'Ruta no encontrada para eliminar.' });
        }

        
        res.status(200).json({ message: 'Ruta eliminada exitosamente.' });
      

    } catch (error) {
        console.error(`Error al eliminar ruta ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar la ruta.' });
    }
});

module.exports = router;