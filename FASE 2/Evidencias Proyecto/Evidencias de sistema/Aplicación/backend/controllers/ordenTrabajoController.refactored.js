// backend/controllers/ordenTrabajoController.js
const ordenTrabajoService = require('../services/ordenTrabajoService');
const { ESTADOS_ORDEN_TRABAJO } = require('../constants/enums');

/**
 * Controlador para la gestión de órdenes de trabajo
 * Maneja las solicitudes HTTP y delega la lógica de negocio al servicio
 */
class OrdenTrabajoController {
  /**
   * @desc    Genera una orden de trabajo desde un plan de mantenimiento
   * @route   POST /api/ordenes-trabajo/generar
   * @access  Private
   */
  async generarOtDesdePlan(req, res) {
    try {
      console.log('Usuario desde token:', req.usuario);

      const resultado = await ordenTrabajoService.generarOtDesdePlan(req.body);

      res.status(201).json(resultado);
    } catch (error) {
      console.error('Error al generar la Orden de Trabajo:', error);

      if (
        error.message.includes('no encontrado') ||
        error.message.includes('no existe')
      ) {
        return res.status(404).json({
          error: error.message,
        });
      }

      if (error.message.includes('Faltan datos')) {
        return res.status(400).json({
          error: error.message,
        });
      }

      res.status(500).json({
        error: 'Error interno del servidor al generar la OT.',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * @desc    Genera múltiples órdenes de trabajo para varios vehículos
   * @route   POST /api/ordenes-trabajo/generar-bulk
   * @access  Private
   */
  async generarOtsParaPlanBulk(req, res) {
    try {
      console.log('Usuario desde token:', req.usuario);
      console.log('Datos recibidos para generación masiva:', req.body);

      const resultado = await ordenTrabajoService.generarOtsParaPlanBulk(
        req.body
      );

      res.status(201).json(resultado);
    } catch (error) {
      console.error('Error al generar las OTs en masa:', error);

      if (
        error.message.includes('no encontrado') ||
        error.message.includes('no existe')
      ) {
        return res.status(404).json({
          error: error.message,
        });
      }

      if (error.message.includes('Faltan datos')) {
        return res.status(400).json({
          error: error.message,
        });
      }

      res.status(500).json({
        error: 'Error interno del servidor al generar las OTs.',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * @desc    Lista todas las órdenes de trabajo
   * @route   GET /api/ordenes-trabajo
   * @access  Private
   */
  async listarOrdenesTrabajo(req, res) {
    try {
      const filtros = this._extraerFiltros(req.query);
      const ordenes = await ordenTrabajoService.listarOrdenesTrabajo(filtros);

      res.status(200).json(ordenes);
    } catch (error) {
      console.error('Error al listar las órdenes de trabajo:', error);
      res.status(500).json({
        error: 'Error interno del servidor al listar las órdenes de trabajo.',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * @desc    Obtiene una orden de trabajo por ID
   * @route   GET /api/ordenes-trabajo/:id
   * @access  Private
   */
  async getOrdenTrabajoPorId(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          error: 'ID de orden de trabajo inválido.',
        });
      }

      const ordenTrabajo = await ordenTrabajoService.obtenerOrdenTrabajoPorId(
        parseInt(id)
      );

      res.status(200).json(ordenTrabajo);
    } catch (error) {
      console.error('Error al obtener la orden de trabajo:', error);

      if (error.message === 'Orden de trabajo no encontrada') {
        return res.status(404).json({
          error: error.message,
        });
      }

      res.status(500).json({
        error: 'Error interno del servidor al obtener la orden de trabajo.',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * @desc    Actualiza el estado de una orden de trabajo
   * @route   PUT /api/ordenes-trabajo/:id/estado
   * @access  Private
   */
  async actualizarEstadoOt(req, res) {
    try {
      const { id } = req.params;
      const { estado_ot, usuario_id_usu_encargado } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          error: 'ID de orden de trabajo inválido.',
        });
      }

      if (!estado_ot) {
        return res.status(400).json({
          error: 'El estado es requerido.',
        });
      }

      const resultado = await ordenTrabajoService.actualizarEstadoOt(
        parseInt(id),
        estado_ot,
        usuario_id_usu_encargado
      );

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al actualizar el estado de la OT:', error);

      if (
        error.message.includes('no válido') ||
        error.message.includes('no encontrado')
      ) {
        return res.status(400).json({
          error: error.message,
        });
      }

      res.status(500).json({
        error: 'Error interno del servidor al actualizar el estado.',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * @desc    Obtiene órdenes de trabajo para un técnico específico
   * @route   GET /api/ordenes-trabajo/tecnico/:tecnicoId
   * @access  Private
   */
  async getOrdenesPorTecnico(req, res) {
    try {
      const { tecnicoId } = req.params;

      if (!tecnicoId || isNaN(tecnicoId)) {
        return res.status(400).json({
          error: 'ID de técnico inválido.',
        });
      }

      const ordenes = await ordenTrabajoService.obtenerOrdenesPorTecnico(
        parseInt(tecnicoId)
      );

      res.status(200).json(ordenes);
    } catch (error) {
      console.error('Error al obtener órdenes para técnico:', error);
      res.status(500).json({
        error: 'Error interno del servidor al obtener las órdenes del técnico.',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * @desc    Genera reporte de mantenimientos
   * @route   GET /api/ordenes-trabajo/reporte/mantenimientos
   * @access  Private
   */
  async getMantenimientoReport(req, res) {
    try {
      const filtros = this._extraerFiltrosReporte(req.query);
      const ordenes = await ordenTrabajoService.listarOrdenesTrabajo(filtros);

      res.status(200).json(ordenes);
    } catch (error) {
      console.error('Error al generar el reporte de mantenimientos:', error);
      res.status(500).json({
        error: 'Error interno del servidor al generar el reporte.',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Métodos privados para procesamiento de datos

  /**
   * Extrae y valida filtros de la query string
   */
  _extraerFiltros(query) {
    const filtros = {};

    if (query.fechaDesde) filtros.fechaDesde = query.fechaDesde;
    if (query.fechaHasta) filtros.fechaHasta = query.fechaHasta;
    if (query.vehiculoId) filtros.vehiculoId = query.vehiculoId;
    if (query.estado) filtros.estado = query.estado;
    if (query.prioridad) filtros.prioridad = query.prioridad;

    return filtros;
  }

  /**
   * Extrae filtros específicos para reportes
   */
  _extraerFiltrosReporte(query) {
    const filtros = {};

    if (query.fechaDesde) filtros.fechaDesde = query.fechaDesde;
    if (query.fechaHasta) filtros.fechaHasta = query.fechaHasta;
    if (query.vehiculoId) filtros.vehiculoId = query.vehiculoId;

    return filtros;
  }
}

// Exportar instancia del controlador
const ordenTrabajoController = new OrdenTrabajoController();

module.exports = {
  generarOtDesdePlan: ordenTrabajoController.generarOtDesdePlan.bind(
    ordenTrabajoController
  ),
  generarOtsParaPlanBulk: ordenTrabajoController.generarOtsParaPlanBulk.bind(
    ordenTrabajoController
  ),
  listarOrdenesTrabajo: ordenTrabajoController.listarOrdenesTrabajo.bind(
    ordenTrabajoController
  ),
  getOrdenTrabajoPorId: ordenTrabajoController.getOrdenTrabajoPorId.bind(
    ordenTrabajoController
  ),
  actualizarEstadoOt: ordenTrabajoController.actualizarEstadoOt.bind(
    ordenTrabajoController
  ),
  getOrdenesPorTecnico: ordenTrabajoController.getOrdenesPorTecnico.bind(
    ordenTrabajoController
  ),
  getMantenimientoReport: ordenTrabajoController.getMantenimientoReport.bind(
    ordenTrabajoController
  ),
};
