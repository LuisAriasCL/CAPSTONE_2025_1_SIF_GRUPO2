// backend/controllers/planificacionController.refactored.js
const planificacionService = require('../services/planificacionService');
const { validarPlanificacion } = require('../utils/validators');
const { ROLES } = require('../constants/enums');

/**
 * Controlador refactorizado para planificaciones de mantenimiento
 * Utiliza el servicio que genera automáticamente OTs
 */

/**
 * Crear una nueva planificación de mantenimiento con OTs automáticas
 */
exports.crearPlanificacionConOts = async (req, res) => {
  try {
    console.log('📝 Creando planificación con OTs automáticas...');
    console.log('Datos recibidos:', req.body);

    // Validar datos de entrada
    const validacion = validarPlanificacion(req.body);
    if (!validacion.esValido) {
      return res.status(400).json({
        success: false,
        message: 'Datos de planificación inválidos',
        errors: validacion.errores,
      });
    }

    // Obtener ID del usuario solicitante (en un entorno real, esto vendría del token JWT)
    // Por ahora, asumimos que se pasa en el body o usamos un valor por defecto
    const idUsuarioSolicitante =
      req.body.idUsuarioSolicitante || req.user?.id_usu || 1;

    // Crear planificación con OTs automáticas
    const resultado = await planificacionService.crearPlanificacionConOts(
      req.body,
      idUsuarioSolicitante
    );

    console.log('✅ Planificación y OTs creadas exitosamente');

    res.status(201).json({
      success: true,
      message:
        'Planificación creada exitosamente con órdenes de trabajo automáticas',
      data: resultado,
    });
  } catch (error) {
    console.error('❌ Error al crear planificación con OTs:', error);

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear la planificación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Listar todas las planificaciones
 */
exports.listarPlanificaciones = async (req, res) => {
  try {
    console.log('📋 Obteniendo lista de planificaciones...');

    const planificaciones =
      await planificacionService.obtenerTodasLasPlanificaciones();

    res.json({
      success: true,
      data: planificaciones,
    });
  } catch (error) {
    console.error('❌ Error al listar planificaciones:', error);

    res.status(500).json({
      success: false,
      message: 'Error al obtener las planificaciones',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Obtener una planificación por ID
 */
exports.obtenerPlanificacionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Obteniendo planificación con ID: ${id}`);

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de planificación inválido',
      });
    }

    const planificacion = await planificacionService.obtenerPlanificacionPorId(
      parseInt(id)
    );

    if (!planificacion) {
      return res.status(404).json({
        success: false,
        message: 'Planificación no encontrada',
      });
    }

    res.json({
      success: true,
      data: planificacion,
    });
  } catch (error) {
    console.error('❌ Error al obtener planificación:', error);

    res.status(500).json({
      success: false,
      message: 'Error al obtener la planificación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Actualizar una planificación
 */
exports.actualizarPlanificacion = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✏️ Actualizando planificación con ID: ${id}`);

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de planificación inválido',
      });
    }

    // Validar datos de entrada
    const validacion = validarPlanificacion(req.body, false); // false para actualización
    if (!validacion.esValido) {
      return res.status(400).json({
        success: false,
        message: 'Datos de planificación inválidos',
        errors: validacion.errores,
      });
    }

    const planificacionActualizada =
      await planificacionService.actualizarPlanificacion(
        parseInt(id),
        req.body
      );

    if (!planificacionActualizada) {
      return res.status(404).json({
        success: false,
        message: 'Planificación no encontrada',
      });
    }

    res.json({
      success: true,
      message: 'Planificación actualizada exitosamente',
      data: planificacionActualizada,
    });
  } catch (error) {
    console.error('❌ Error al actualizar planificación:', error);

    res.status(500).json({
      success: false,
      message: 'Error al actualizar la planificación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Eliminar una planificación
 */
exports.eliminarPlanificacion = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Eliminando planificación con ID: ${id}`);

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de planificación inválido',
      });
    }

    const resultado = await planificacionService.eliminarPlanificacion(
      parseInt(id)
    );

    if (!resultado) {
      return res.status(404).json({
        success: false,
        message: 'Planificación no encontrada',
      });
    }

    res.json({
      success: true,
      message: 'Planificación eliminada exitosamente',
    });
  } catch (error) {
    console.error('❌ Error al eliminar planificación:', error);

    res.status(500).json({
      success: false,
      message: 'Error al eliminar la planificación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
