// backend/controllers/ordenTrabajoController.js
const db = require('../models');
const sequelize = db.sequelize;
const { OrdenTrabajo, DetalleOt, PlanificacionMantenimiento, Vehiculo, VehiculoPlanificacion, Usuario, TareaPlanificacion } = db;

// ... (El código para generarOtDesdePlan, etc. se queda como está) ...
exports.generarOtDesdePlan = async (req, res) => {
    // Tu código funcional para generar OT va aquí...
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

        const vehiculoPlan = await VehiculoPlanificacion.findOne({
            where: { vehiculoIdVehi: id_vehi, planificacionMantenimientoIdPlan: id_plan }
        });

        if (!vehiculoPlan) {
            await t.rollback();
            return res.status(404).json({ error: 'La asociación entre el vehículo y el plan no existe.' });
        }

        const nuevaOt = await OrdenTrabajo.create({
            km_ot: vehiculo.kmVehi,
            descripcion_ot: `OT generada desde el plan: "${planificacion.descPlan}"`,
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
    // Tu código funcional para listar OTs va aquí...
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


// --- FUNCIÓN CORREGIDA Y MÁS SEGURA ---
exports.getOrdenTrabajoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const orden = await OrdenTrabajo.findByPk(id, {
            include: [
                { model: Vehiculo, as: 'vehiculo', required: false },
                { model: Usuario, as: 'solicitante', required: false, attributes: { exclude: ['clave'] } },
                { model: Usuario, as: 'encargado', required: false, attributes: { exclude: ['clave'] } },
                {
                    model: DetalleOt,
                    as: 'detalles',
                    required: false, // LEFT JOIN para los detalles
                    include: [{
                        model: Usuario,
                        as: 'tecnico',
                        required: false, // LEFT JOIN para el técnico (muy importante)
                        attributes: { exclude: ['clave'] }
                    }]
                }
            ]
        });

        if (!orden) {
            return res.status(404).json({ error: 'Orden de Trabajo no encontrada.' });
        }
        res.status(200).json(orden);
    } catch (error) {
        console.error("Error CRÍTICO al obtener la orden de trabajo:", error);
        res.status(500).json({ message: 'Error interno del servidor al consultar la OT.', error: error.message });
    }
};

exports.actualizarDetallesOt = async (req, res) => {
    // Espera un array: [{ id_det: 1, checklist: true, usuarioIdUsuTecnico: 5 }, ...]
    const detallesParaActualizar = req.body;

    if (!Array.isArray(detallesParaActualizar)) {
        return res.status(400).json({ error: 'Formato de datos incorrecto.' });
    }

    const t = await sequelize.transaction();
    try {
        for (const detalle of detallesParaActualizar) {
            await DetalleOt.update(
                {
                    checklist: detalle.checklist,
                    // Usamos el nombre correcto de la foreignKey que confirmaste
                    usuarioIdUsuTecnico: detalle.usuarioIdUsuTecnico
                },
                { where: { id_det: detalle.id_det }, transaction: t }
            );
        }

        await t.commit();
        res.status(200).json({ message: 'Cambios guardados con éxito.' });
    } catch (error) {
        await t.rollback();
        console.error('Error al actualizar los detalles de la OT:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};