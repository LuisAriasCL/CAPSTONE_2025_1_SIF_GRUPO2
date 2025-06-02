// backend/routes/asignacionesRecorrido.js
const express = require('express');
const router = express.Router();
const { AsignacionRecorrido, Vehiculo, Usuario, Ruta, sequelize } = require('../models');
const { Op } = require('sequelize');

// POST /api/asignaciones-recorrido - Crear una nueva asignación de recorrido
router.post('/', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let {
      fecIniRecor,
      fecFinRecor,
      kmIniRecor,
      notas,
      vehiculoIdVehi,
      usuarioIdUsu,
      rutaIdRuta,
      estadoAsig = 'asignado',
    } = req.body;

    if (!fecIniRecor || !vehiculoIdVehi || !usuarioIdUsu || !rutaIdRuta) {
      await t.rollback();
      return res.status(400).json({ message: 'Fecha de inicio, vehículo, conductor y ruta plantilla son requeridos.' });
    }

    const vehiculo = await Vehiculo.findByPk(vehiculoIdVehi, { transaction: t });
    if (!vehiculo) {
      await t.rollback();
      return res.status(404).json({ message: 'Vehículo no encontrado.' });
    }

    const conductor = await Usuario.findByPk(usuarioIdUsu, { transaction: t });
    if (!conductor) {
      await t.rollback();
      return res.status(404).json({ message: 'Conductor no encontrado.' });
    }
    if (conductor.rol !== 'conductor') {
      await t.rollback();
      return res.status(400).json({ message: 'El usuario seleccionado no tiene el rol de conductor.' });
    }

    const rutaPlantilla = await Ruta.findByPk(rutaIdRuta, { transaction: t });
    if (!rutaPlantilla) {
      await t.rollback();
      return res.status(404).json({ message: 'Ruta plantilla no encontrada.' });
    }

    const kilometrajeInicialAUsar = (kmIniRecor !== undefined && kmIniRecor !== null) ? parseInt(kmIniRecor, 10) : vehiculo.kmVehi;
    if (isNaN(kilometrajeInicialAUsar)) {
        await t.rollback();
        return res.status(400).json({ message: 'Kilometraje inicial inválido.' });
    }

    const nuevaAsignacion = await AsignacionRecorrido.create({
      fecIniRecor,
      fecFinRecor: fecFinRecor || null,
      kmIniRecor: kilometrajeInicialAUsar,
      notas,
      vehiculoIdVehi,
      usuarioIdUsu,
      rutaIdRuta,
      estadoAsig,
    }, { transaction: t });

    await t.commit();

    if (req.io) {
      req.io.emit('asignacionCreada', nuevaAsignacion);
    }
    res.status(201).json(nuevaAsignacion);
  } catch (error) {
    await t.rollback();
    console.error("Error al crear asignación de recorrido:", error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Error interno del servidor al crear la asignación.' });
  }
});

// GET /api/asignaciones-recorrido - Listar todas las asignaciones con filtros opcionales
router.get('/', async (req, res) => {
  try {
    const { estado, vehiculoId, conductorId, fechaDesde, fechaHasta } = req.query;
    const whereClause = {};

    if (estado) whereClause.estadoAsig = estado;
    if (vehiculoId) whereClause.vehiculoIdVehi = vehiculoId;
    if (conductorId) whereClause.usuarioIdUsu = conductorId;
    if (fechaDesde) whereClause.fecIniRecor = { [Op.gte]: new Date(fechaDesde) };
    if (fechaHasta) {
        whereClause.fecIniRecor = {
            ...(whereClause.fecIniRecor || {}),
            [Op.lte]: new Date(new Date(fechaHasta).setHours(23, 59, 59, 999))
        };
    }

    const asignaciones = await AsignacionRecorrido.findAll({
      where: whereClause,
      include: [
        { model: Vehiculo, as: 'vehiculo', attributes: ['idVehi', 'patente', 'modelo', 'marca'] },
        { model: Usuario, as: 'conductor', attributes: ['idUsu', 'priNomUsu', 'priApeUsu', 'email'] },

        { model: Ruta, as: 'rutaPlantilla', attributes: ['idRuta', 'nombreRuta', 'kilometrosRuta'] }
     
      ],
      order: [['fecIniRecor', 'DESC']]
    });
    res.status(200).json(asignaciones);
  } catch (error) {
    console.error("Error al obtener asignaciones de recorrido:", error);
    // Devolver el error completo para más detalles en el frontend si es necesario
    res.status(500).json({ 
        message: 'Error interno del servidor al obtener asignaciones.', 
        error: error.message, 
        sql: error.parent?.sql // Si el error tiene un 'parent' con info SQL
    });
  }
});

// GET /api/asignaciones-recorrido/:idAsig - Obtener una asignación específica
router.get('/:idAsig', async (req, res) => {
  try {
    const { idAsig } = req.params;
    const asignacion = await AsignacionRecorrido.findByPk(idAsig, {
      include: [
        { model: Vehiculo, as: 'vehiculo' },
        { model: Usuario, as: 'conductor' },
        { model: Ruta, as: 'rutaPlantilla' } // Aquí no se especifican atributos, así que trae todos los del modelo Ruta
      ]
    });
    if (!asignacion) {
      return res.status(404).json({ message: 'Asignación no encontrada.' });
    }
    res.status(200).json(asignacion);
  } catch (error) {
    console.error("Error al obtener asignación:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// PUT /api/asignaciones-recorrido/:idAsig - Actualizar una asignación
router.put('/:idAsig', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { idAsig } = req.params;
    const asignacion = await AsignacionRecorrido.findByPk(idAsig, { transaction: t });
    if (!asignacion) {
      await t.rollback();
      return res.status(404).json({ message: 'Asignación no encontrada.' });
    }

    const datosActualizacion = req.body;

    if (datosActualizacion.estadoAsig === 'en_progreso' && asignacion.estadoAsig !== 'en_progreso') {
      if (datosActualizacion.kmIniRecor === undefined || datosActualizacion.kmIniRecor === null) {
        const vehiculo = await Vehiculo.findByPk(asignacion.vehiculoIdVehi, { transaction: t });
        datosActualizacion.kmIniRecor = vehiculo ? vehiculo.kmVehi : asignacion.kmIniRecor;
      }
      if (!datosActualizacion.fecIniRecor) {
        datosActualizacion.fecIniRecor = new Date();
      }
    }

    if (datosActualizacion.estadoAsig === 'completado') {
      if (datosActualizacion.kmFinRecor === undefined || datosActualizacion.kmFinRecor === null || datosActualizacion.kmFinRecor <= asignacion.kmIniRecor) {
        await t.rollback();
        return res.status(400).json({ message: 'Kilometraje final es requerido y debe ser mayor al inicial para completar la asignación.' });
      }
      if (!datosActualizacion.fecFinRecor) {
        datosActualizacion.fecFinRecor = new Date();
      }
      await Vehiculo.update(
        { kmVehi: datosActualizacion.kmFinRecor },
        { where: { idVehi: asignacion.vehiculoIdVehi }, transaction: t }
      );
    }

    await asignacion.update(datosActualizacion, { transaction: t });
    await t.commit();

    if (req.io) {
      req.io.emit('asignacionActualizada', asignacion);
    }
    res.status(200).json(asignacion);
  } catch (error) {
    await t.rollback();
    console.error("Error al actualizar asignación:", error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// DELETE /api/asignaciones-recorrido/:idAsig - Eliminar/Cancelar una asignación
router.delete('/:idAsig', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { idAsig } = req.params;
    const asignacion = await AsignacionRecorrido.findByPk(idAsig, { transaction: t });
    if (!asignacion) {
      await t.rollback();
      return res.status(404).json({ message: 'Asignación no encontrada.' });
    }

    await asignacion.destroy({ transaction: t });
    await t.commit();
    if (req.io) {
        req.io.emit('asignacionEliminada', { idAsig: parseInt(idAsig, 10) });
    }
    res.status(200).json({ message: 'Asignación eliminada exitosamente.' });

  } catch (error) {
    await t.rollback();
    console.error("Error al eliminar/cancelar asignación:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;
