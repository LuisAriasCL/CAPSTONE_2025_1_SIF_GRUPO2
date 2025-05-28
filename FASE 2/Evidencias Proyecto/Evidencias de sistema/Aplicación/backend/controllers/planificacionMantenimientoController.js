// backend/controllers/planificacionMantenimientoController.js
const { PlanificacionMantenimiento, TareaPlanificacion, Vehiculo, VehiculoPlanificacion, sequelize } = require('../models'); // Asegúrate que la ruta a tus modelos sea correcta

// Crear una nueva Planificación de Mantenimiento
exports.crearPlanificacion = async (req, res) => {
    const transaction = await sequelize.transaction();

    console.log('CUERPO DE LA SOLICITUD RECIBIDO:', req.body);

    try {
        const {
            descPlan,
            frecuencia,
            tipoFrecuencia,
            esActivoPlan,
            esPreventivo,
            tareas,
            vehiculosIds
        } = req.body;

        // Validación básica de entrada
        if (!descPlan || !tareas || !Array.isArray(tareas) || tareas.length === 0) {
            // No es necesario rollback aquí porque la transacción aún no ha hecho nada
            return res.status(400).json({ msg: 'La descripción y al menos una tarea son obligatorias.' });
        }
        if (typeof esPreventivo === 'undefined' || esPreventivo === null) {
            return res.status(400).json({ msg: 'El campo "esPreventivo" es obligatorio y no puede ser nulo.' });
        }
        if (typeof esActivoPlan === 'undefined' || esActivoPlan === null) {
            return res.status(400).json({ msg: 'El campo "esActivoPlan" es obligatorio y no puede ser nulo.' });
        }
        if (!vehiculosIds || !Array.isArray(vehiculosIds) || vehiculosIds.length === 0) {
            return res.status(400).json({ msg: 'Se debe asignar al menos un vehículo.' });
        }
        // Considera añadir validaciones para 'frecuencia' y 'tipoFrecuencia' si son obligatorios

        // Objeto para crear la PlanificacionMantenimiento
        const datosParaPlanificacion = {
            descPlan,
            frecuencia,
            tipoFrecuencia,
            esActivoPlan, // Ya se valida que no sea undefined/null
            esPreventivo  // Ya se valida que no sea undefined/null
        };

        console.log('Valores a crear en PlanificacionMantenimiento:', datosParaPlanificacion);

        // 1. Crear la Planificación de Mantenimiento
        const nuevaPlanificacion = await PlanificacionMantenimiento.create(datosParaPlanificacion, { transaction });

        // 2. Crear las Tareas de Planificación asociadas
        const tareasCreadasPromises = tareas.map(tarea => {
            if (!tarea.nomTareaPlan) {
                // Si esto lanza un error, será capturado por el bloque catch general
                throw new Error('El nombre de la tarea (nomTareaPlan) es obligatorio para todas las tareas.');
            }
            return TareaPlanificacion.create({
                nomTareaPlan: tarea.nomTareaPlan,
                descTareaPlan: tarea.descTareaPlan,
                planificacionMantenimientoIdPlan: nuevaPlanificacion.idPlan // Sequelize usará la FK correcta
            }, { transaction });
        });
        await Promise.all(tareasCreadasPromises); // Espera a que todas las tareas se creen

        // 3. Asociar los Vehículos a la Planificación USANDO MÉTODO HELPER
        if (vehiculosIds && vehiculosIds.length > 0) {
            // El alias 'vehiculosEnPlan' debe estar definido en la asociación
            // PlanificacionMantenimiento.belongsToMany(Vehiculo, { ..., as: 'vehiculosEnPlan' }) en tu index.js
            await nuevaPlanificacion.addVehiculosEnPlan(vehiculosIds, {
                transaction,
                // Si quieres pasar valores a las columnas adicionales de VEHICULO_PLANIFICACION
                // (fec_ult_plan, km_ult_plan, etc.), lo haces con la opción 'through'.
                // Asegúrate de que el modelo VehiculoPlanificacion.js tenga estos campos definidos.
                // through: {
                //   fecUltPlan: new Date(), // o null, o un valor específico
                //   kmUltPlan: 0,         // o null, o un valor específico
                //   fecProxPlan: null,
                //   kmProxPlan: 0
                // }
            });
        }

        // Si todo fue exitoso, confirma la transacción
        await transaction.commit();

        // Devolver la planificación creada con sus tareas y vehículos
        // Hacemos esta consulta fuera de la transacción, después del commit.
        const planificacionCompleta = await PlanificacionMantenimiento.findByPk(nuevaPlanificacion.idPlan, {
            include: [
                { model: TareaPlanificacion, as: 'tareas' }, // <--- PROBLEMA AQUÍ
                { model: Vehiculo, as: 'vehiculosEnPlan', attributes: ['idVehi', 'patente', 'marca', 'modelo'] }
            ]
        });

        res.status(201).json({ msg: 'Planificación creada exitosamente', planificacion: planificacionCompleta });

    } catch (error) {
        // Solo hacer rollback si la transacción no ha sido finalizada (commit o rollback previo)
        if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Error al intentar hacer rollback de la transacción:', rollbackError);
            }
        }

        if (error.name === 'SequelizeValidationError') {
            const errores = error.errors.map(err => ({ campo: err.path, mensaje: err.message }));
            console.error('Error de validación al crear planificación:', errores);
            return res.status(400).json({ msg: 'Error de validación.', errores: errores });
        }
        console.error('Error al crear planificación:', error); // Muestra el error completo
        const errorMessage = error.parent && error.parent.sqlMessage ? error.parent.sqlMessage : error.message;
        res.status(500).json({ msg: 'Error interno del servidor al crear la planificación.', error: errorMessage });
    }
};

// Listar todas las Planificaciones de Mantenimiento
exports.listarPlanificaciones = async (req, res) => {
    try {
        const planificaciones = await PlanificacionMantenimiento.findAll({
            include: [
                {
                    model: TareaPlanificacion,
                    as: 'tareas' // Asegúrate que este alias coincida con el definido en tu index.js
                },
                {
                    model: Vehiculo,
                    as: 'vehiculosEnPlan', // Asegúrate que este alias coincida con el definido en tu index.js
                    attributes: ['idVehi', 'patente', 'marca', 'modelo'],
                    through: { attributes: [] } // No incluir atributos de la tabla de unión
                }
            ],
            // Si tu modelo PlanificacionMantenimiento tiene timestamps:true y fec_cre_plan:
            // order: [['fecCrePlan', 'DESC']]
            // Si no, ordena por idPlan o el campo que prefieras:
            order: [['idPlan', 'DESC']]
        });
        res.status(200).json(planificaciones);
    } catch (error) {
        console.error('Error al listar planificaciones:', error);
        res.status(500).json({ msg: 'Error interno del servidor al listar las planificaciones.', error: error.message });
    }
};

// (Más adelante añadiremos obtenerPorId, actualizar, eliminar)