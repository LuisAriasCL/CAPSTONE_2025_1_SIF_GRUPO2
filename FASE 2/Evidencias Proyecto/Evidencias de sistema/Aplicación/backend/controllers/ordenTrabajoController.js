const db = require('../models');
const sequelize = db.sequelize;
const { OrdenTrabajo, DetalleOt, PlanificacionMantenimiento, Vehiculo, VehiculoPlanificacion, Usuario, TareaPlanificacion } = db;
const { Op } = require('sequelize');

exports.getMantenimientoReport = async (req, res) => {
    try {
        const { fechaDesde, fechaHasta, vehiculoId } = req.query;

        let whereClause = {};
        
        // Aplicar filtro de fecha si se proporcionan ambas fechas
        if (fechaDesde && fechaHasta) {
            whereClause.fec_ini_ot = {
                [Op.between]: [new Date(fechaDesde), new Date(fechaHasta)]
            };
        }
        
        // Aplicar filtro de vehículo si se proporciona
        if (vehiculoId) {
            whereClause.vehiculoIdVehi = vehiculoId;
        }

        const ordenes = await OrdenTrabajo.findAll({
            where: whereClause,
            include: [
                {
                    model: Vehiculo,
                    as: 'vehiculo',
                    attributes: ['patente', 'marca', 'modelo']
                },
                {
                    model: Usuario,
                    as: 'encargado', // Usamos el 'encargado' como el técnico principal para el reporte
                    attributes: ['pri_nom_usu', 'pri_ape_usu']
                }
            ],
            order: [['fec_ini_ot', 'DESC']]
        });
        
        res.status(200).json(ordenes);

    } catch (error) {
        console.error("Error al generar el reporte de mantenimientos:", error);
        res.status(500).json({ message: "Error interno del servidor al generar el reporte" });
    }
};

exports.generarOtDesdePlan = async (req, res) => {
     console.log('Usuario desde token:', req.usuario);

const { id_plan, id_vehi, id_usuario_solicitante } = req.body;

if (!id_plan || !id_vehi || !id_usuario_solicitante) {
    return res.status(400).json({ error: 'Faltan datos requeridos: id_plan, id_vehi y id_usuario_solicitante son obligatorios.' });
}

    const t = await sequelize.transaction();

    try {
        const vehiculo = await Vehiculo.findByPk(id_vehi);
        if (!vehiculo) {
            await t.rollback();
            return res.status(404).json({ error: 'Vehículo no encontrado.' });
        }

        const planificacion = await PlanificacionMantenimiento.findByPk(id_plan, {
            include: [{ model: TareaPlanificacion, as: 'tareas' }]
        });

        if (!planificacion || !planificacion.tareas || planificacion.tareas.length === 0) {
            await t.rollback();
            return res.status(404).json({ error: 'Planificación no encontrada o no tiene tareas asociadas.' });
        }
 const solicitante = await Usuario.findByPk(id_usuario_solicitante, { transaction: t });
        if (!solicitante) {
            await t.rollback();
            return res.status(404).json({ error: `El usuario solicitante con ID ${id_usuario_solicitante} extraído del token no fue encontrado en la base de datos.` });
        }
        const vehiculoPlan = await VehiculoPlanificacion.findOne({
            where: { vehiculoIdVehi: id_vehi, planificacionMantenimientoIdPlan: id_plan }
        });

        if (!vehiculoPlan) {
            await t.rollback();
            return res.status(404).json({ error: 'La asociación entre el vehículo y el plan no existe.' });
        }
 let fechaParaOt = null;
        if (planificacion.fechaActivacion) {
            
            fechaParaOt = `${planificacion.fechaActivacion}T00:00:00`;
        }
        const nuevaOt = await OrdenTrabajo.create({
            km_ot: vehiculo.kmVehi,
            descripcion_ot: `OT generada desde el plan: "${planificacion.descPlan}"`,
             fec_ini_ot: fechaParaOt,
            vehiculoIdVehi: id_vehi,
            usuarioIdUsuSolicitante: id_usuario_solicitante,
            vehiculoPlanificacionVehiculoIdVehi: id_vehi,
            vehiculoPlanificacionPlanIdPlan: id_plan,
        }, { transaction: t });
        
        const detallesParaCrear = planificacion.tareas.map(tarea => ({
            desc_det: tarea.nomTareaPlan,
            ordenTrabajoIdOt: nuevaOt.id_ot
        }));

        await DetalleOt.bulkCreate(detallesParaCrear, { transaction: t });

        await t.commit();
        res.status(201).json({ message: 'Orden de Trabajo generada con éxito.', id_ot: nuevaOt.id_ot });

    } catch (error) {
        await t.rollback();
        console.error('Error al generar la Orden de Trabajo:', error);
        res.status(500).json({ error: 'Error interno del servidor al generar la OT.', details: error.message || error });
    }
};

exports.listarOrdenesTrabajo = async (req, res) => {
    try {
        const ordenes = await OrdenTrabajo.findAll({
            include: [
                { model: Vehiculo, as: 'vehiculo', attributes: ['patente', 'marca', 'modelo'] },
                { model: Usuario, as: 'solicitante', attributes: ['pri_nom_usu', 'pri_ape_usu'] }
            ],
            order: [['fec_ini_ot', 'DESC']]
        });
        res.status(200).json(ordenes);
    } catch (error) {
        console.error("Error al listar las órdenes de trabajo:", error);
        res.status(500).send('Error interno del servidor');
    }
};

exports.getOrdenTrabajoPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const ordenTrabajo = await OrdenTrabajo.findByPk(id, {
      include: [
        {
          model: Vehiculo,
          as: 'vehiculo', 
          attributes: ['patente', 'marca', 'modelo']
        },
        {
          model: Usuario,
          as: 'solicitante', 
          attributes: ['pri_nom_usu', 'pri_ape_usu']
        },
        {
          model: Usuario,
          as: 'encargado',
          attributes: ['id_usu', 'pri_nom_usu', 'pri_ape_usu']
        },
        {
          model: DetalleOt,
          as: 'detalles',
          include: [
            {
              model: Usuario,
              as: 'tecnico', 
              attributes: ['id_usu', 'pri_nom_usu', 'pri_ape_usu']
            }
          ]
        }
      ]
    });

    if (!ordenTrabajo) {
      return res.status(404).json({ message: 'Orden de trabajo no encontrada' });
    }

    res.json(ordenTrabajo);
  } catch (error) {
    console.error('Error al obtener la orden de trabajo:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};


exports.getOrdenesPorTecnico = async (req, res) => {
  try {
    const { tecnicoId } = req.params;

    const ordenes = await OrdenTrabajo.findAll({
      include: [
        {
          model: DetalleOt,
          as: 'detalles',
          
          where: { usuarioIdUsuTecnico: tecnicoId },
          required: true 
        },
        {
          model: Vehiculo,
          as: 'vehiculo',
          attributes: ['patente', 'marca', 'modelo']
        }
      ],
      order: [['fec_ini_ot', 'DESC']]
    });

    res.status(200).json(ordenes);
  } catch (error) {
    console.error("Error al obtener órdenes de trabajo para el técnico:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.actualizarDetallesOt = async (req, res) => {
   
    const { id: idOt } = req.params; 
    const { km_ot, descripcion_ot, detalles } = req.body;

    
    if (!Array.isArray(detalles)) {
        return res.status(400).json({ error: 'Formato de datos incorrecto. Se espera un array de "detalles".' });
    }

    const t = await sequelize.transaction();
    try {
      
        if (km_ot !== undefined && descripcion_ot !== undefined) {
            await OrdenTrabajo.update({
                km_ot: km_ot,
                descripcion_ot: descripcion_ot 
            }, {
                where: { id_ot: idOt },
                transaction: t
            });
        }
        
       
        for (const detalle of detalles) {
            const dataToUpdate = {
                checklist: detalle.checklist,
               
                ...(detalle.usuario_id_usu_tecnico && { usuario_id_usu_tecnico: detalle.usuario_id_usu_tecnico })
            };

            await DetalleOt.update(
                dataToUpdate,
                { 
                    where: { 
                        id_det: detalle.id_det,
                       
                        ordenTrabajoIdOt: idOt 
                    }, 
                    transaction: t 
                }
            );
        }
        
        await t.commit();
        res.status(200).json({ message: 'Cambios guardados con éxito.' });
    } catch (error) {
        await t.rollback();
        console.error('Error al actualizar la OT:', error);
        res.status(500).json({ error: 'Error interno del servidor al actualizar la OT.' });
    }
};

exports.actualizarEstadoOt = async (req, res) => {
    const { id } = req.params;
    const { estado_ot, usuario_id_usu_encargado } = req.body;

    if (!estado_ot) {
        return res.status(400).json({ message: 'El campo estado_ot es requerido.' });
    }

    try {
        const ordenTrabajo = await OrdenTrabajo.findByPk(id);
        if (!ordenTrabajo) {
            return res.status(404).json({ message: 'Orden de trabajo no encontrada' });
        }

        const camposAActualizar = { estado_ot: estado_ot };

        if (estado_ot === 'en_progreso' && usuario_id_usu_encargado) {
            camposAActualizar.usuario_id_usu_encargado = usuario_id_usu_encargado;
            
            if (!ordenTrabajo.fec_ini_ot) {
                camposAActualizar.fec_ini_ot = new Date();
            }
        }
        
        if (estado_ot === 'completado') {
            camposAActualizar.fec_fin_ot = new Date();
        }

        await ordenTrabajo.update(camposAActualizar);
        res.json({ message: 'El estado de la Orden de Trabajo ha sido actualizado exitosamente.', ordenTrabajo });

    } catch (error) {
        console.error('Error al actualizar el estado de la OT:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};
