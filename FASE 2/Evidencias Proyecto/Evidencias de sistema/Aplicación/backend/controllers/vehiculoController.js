// Fichero: backend/controllers/vehiculoController.js

const {
  OrdenTrabajo,
  Siniestro,
  RegistroCombustible,
  DetalleOt,
  Usuario,
  PlanificacionMantenimiento
} = require('../models');

exports.getHistorialByVehiculoId = async (req, res) => {
  try {
    const vehiculoId = req.params.id;

    // --- Consultas a la BD (Estas ya son correctas) ---
    const mantenimientos = await OrdenTrabajo.findAll({
      where: { vehiculoIdVehi: vehiculoId },
      include: [{ model: DetalleOt, as: 'detalles' }]
    });

    const siniestros = await Siniestro.findAll({
      where: { vehiculoId: vehiculoId }
    });

    const combustibles = await RegistroCombustible.findAll({
      where: { vehiculoId: vehiculoId },
      include: [{
        model: Usuario,
        attributes: ['pri_nom_usu', 'pri_ape_usu']
      }]
    });
    
    // --- Mapeo y enriquecimiento de datos ---

    const historialMantenimiento = await Promise.all(
      mantenimientos.map(async (ot) => {
        const otData = ot.dataValues;
        let nombrePlan = 'Mantenimiento Correctivo';
        let tecnicoAsignado = 'Técnico no asignado';

        if (otData.planificacionMantenimientoIdPlan) {
          const plan = await PlanificacionMantenimiento.findByPk(otData.planificacionMantenimientoIdPlan);
          if (plan) nombrePlan = plan.nombre_plan;
        }

        if (otData.detalles && otData.detalles.length > 0 && otData.detalles[0].usuarioIdUsuTecnico) {
          const tecnico = await Usuario.findByPk(otData.detalles[0].usuarioIdUsuTecnico);
          if (tecnico) tecnicoAsignado = `${tecnico.pri_nom_usu} ${tecnico.pri_ape_usu}`;
        }
        
        const costoTotal = (otData.detalles || []).reduce((acc, detalle) => {
          return acc + (Number(detalle.costo_repuestos) || 0) + (Number(detalle.costo_mo) || 0);
        }, 0);

        return {
          tipo: 'Mantenimiento',
          fecha: otData.fec_cre_ot,
          titulo: nombrePlan,
          subtitulo: tecnicoAsignado,
          costo: costoTotal,
          id: otData.id_ot,
          icon: 'build-outline',
          color: 'warning'
        };
      })
    );

    const historialSiniestro = siniestros.map(s => {
      const sData = s.dataValues;
      // CORRECCIÓN: Usando los nombres de propiedad que vimos en el log ('tipo', 'estado', etc.)
      return {
        tipo: 'Siniestro',
        fecha: sData.fecha,
        titulo: `Siniestro: ${sData.tipo}`,
        subtitulo: `Estado: ${sData.estado}`,
        costo: null,
        id: sData.id,
        icon: 'alert-circle-outline',
        color: 'danger'
      }
    });

     const historialCombustible = combustibles.map(c => {
      const conductor = c.get('Usuario');
      return {
        tipo: 'Combustible',
        fecha: c.get('fecha'),
        titulo: `Carga de ${c.get('litros')} Lts`,
        subtitulo: conductor ? `Registrado por: ${conductor.get('pri_nom_usu')} ${conductor.get('pri_ape_usu')}` : 'Registro manual',
        costo: c.get('monto'),
        id: c.get('id'),
        // CAMBIO: Añadir la URL del comprobante al objeto que enviamos
        urlComprobante: c.get('urlComprobante'),
        icon: 'color-fill-outline',
        color: 'primary'
      };
    });

    // --- 5. Combinar y ordenar ---
    const historialCompleto = [...historialMantenimiento, ...historialSiniestro, ...historialCombustible];
    historialCompleto.sort((a, b) => {
        // Asegurarse de que las fechas son válidas antes de comparar
        const dateA = a.fecha ? new Date(a.fecha) : 0;
        const dateB = b.fecha ? new Date(b.fecha) : 0;
        return dateB - dateA;
    });

    res.json(historialCompleto);

  } catch (error) {
    console.error("Error detallado en el controlador del historial:", error);
    res.status(500).send('Error en el servidor al obtener el historial.');
  }
};