// backend/controllers/statsController.js
const { Vehiculo, OrdenTrabajo, sequelize, Siniestro, RegistroCombustible, DetalleOt, AsignacionRecorrido, PlanificacionMantenimiento, Usuario } = require('../models');
const { Op } = require('sequelize');

exports.getDashboardKpis = async (req, res) => {
    try {
        console.log("\n--- [START] Calculando KPIs para el Dashboard ---");

        // Definir el rango de tiempo para "último mes" (30 días)
        const treintaDiasAtras = new Date();
        treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);
        console.log(`Rango de tiempo para 30 días: Desde ${treintaDiasAtras.toISOString().split('T')[0]}`);

        // --- 1. Contar vehículos totales y por estado ---
        const totalVehiculos = await Vehiculo.count();
        console.log("Paso 1.1 - Vehículos Totales (COUNT):", totalVehiculos);
        
        const vehiculosPorEstado = await Vehiculo.findAll({
            attributes: [
                'estado_vehi',
                [sequelize.fn('COUNT', sequelize.col('estado_vehi')), 'count']
            ],
            group: ['estado_vehi'],
            raw: true // Para obtener objetos planos
        });

        const estadoVehiculos = vehiculosPorEstado.reduce((acc, item) => {
            acc[item.estado_vehi] = parseInt(item.count, 10);
            return acc;
        }, {});
        console.log("Paso 1.2 - Vehículos por Estado:", estadoVehiculos);

        // --- 2. Contar siniestros en los últimos 30 días ---
        const siniestrosMes = await Siniestro.count({
            where: {
                fecha: { [Op.gte]: treintaDiasAtras }
            }
        });
        console.log("Paso 2 - Siniestros del Último Mes:", siniestrosMes);

        // --- 3. Cálculo de eficiencia promedio de combustible (km/L) ---
        // Sumar KM recorridos de asignaciones completadas con fecha de fin en los últimos 30 días
        const totalKmRecorridosResult = await AsignacionRecorrido.findAll({
            attributes: [
                [sequelize.literal('SUM(km_fin_recor - km_ini_recor)'), 'totalKm']
            ],
            where: {
                fecFinRecor: { [Op.gte]: treintaDiasAtras },
                estadoAsig: 'completado'
            },
            raw: true
        });
        const totalKmRecorridos = totalKmRecorridosResult[0]?.totalKm || 0;

        // Sumar litros de registros de combustible en los últimos 30 días
        const totalLitrosConsumidosResult = await RegistroCombustible.sum('litros', {
            where: {
                fecha: { [Op.gte]: treintaDiasAtras }
            }
        });
        const totalLitrosConsumidos = totalLitrosConsumidosResult || 0;

        const eficienciaCombustiblePromedio = totalLitrosConsumidos > 0 ? (totalKmRecorridos / totalLitrosConsumidos) : 0;
        console.log(`Paso 3 - Eficiencia de Combustible: ${totalKmRecorridos} KM / ${totalLitrosConsumidos} L = ${eficienciaCombustiblePromedio.toFixed(2)} km/L`);

        // --- 4. Contar recorridos actualmente en curso (estado 'en_progreso') ---
        const recorridosEnCurso = await AsignacionRecorrido.count({
            where: {
                estadoAsig: 'en_progreso'
            }
        });
        console.log("Paso 4 - Recorridos en Curso:", recorridosEnCurso);

        // --- 5. Alertas de Mantenimiento Pendiente ---
        // Se considera "pendiente" las OTs en estados que no sean 'completada' o 'cancelada'
        const alertasMantenimientoPendiente = await OrdenTrabajo.count({
            where: {
                estado_ot: { [Op.notIn]: ['completada', 'cancelada'] }
            }
        });
        console.log("Paso 5 - Alertas de Mantenimiento Pendiente:", alertasMantenimientoPendiente);

        // --- 6. Alertas de Siniestros Pendientes ---
        // Se considera "pendientes" los siniestros en estados como 'reportado', 'en_revision', 'en_proceso'
        const alertasSiniestrosPendientes = await Siniestro.count({
            where: {
                estado: { [Op.in]: ['reportado', 'en_revision', 'en_proceso'] }
            }
        });
        console.log("Paso 6 - Alertas de Siniestros Pendientes:", alertasSiniestrosPendientes);
        
        // --- 7. Vehículos Próximos a Mantenimiento (Planes Activos) ---
        // Contamos planificaciones de mantenimiento activas
        const vehiculosProximoMantenimiento = await PlanificacionMantenimiento.count({
            where: {
                esActivoPlan: true
            }
        });
        console.log("Paso 7 - Vehículos Próximos a Mantenimiento (Planes Activos):", vehiculosProximoMantenimiento);


        // --- Consolidar todos los KPIs para la respuesta ---
        const kpis = {
            totalVehiculos,
            vehiculosOperativos: estadoVehiculos.activo || 0,
            vehiculosEnTaller: estadoVehiculos.mantenimiento || 0,
            siniestrosMes,
            eficienciaCombustiblePromedio: parseFloat(eficienciaCombustiblePromedio.toFixed(2)),
            recorridosEnCurso,
            alertasMantenimientoPendiente,
            alertasSiniestrosPendientes,
            vehiculosProximoMantenimiento // Nuevo KPI
        };

        console.log("--- [FINAL] KPIs a enviar al frontend ---", kpis);
        res.status(200).json(kpis);

    } catch (error) {
        console.error("Error al obtener KPIs del dashboard:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

exports.getVehiculosPorTipo = async (req, res) => {
    try {
        const stats = await Vehiculo.findAll({
            attributes: [
                'tipo_vehi',
                [sequelize.fn('COUNT', sequelize.col('tipo_vehi')), 'count']
            ],
            group: ['tipo_vehi'],
            raw: true
        });

        const chartData = {
            labels: stats.map(item => item.tipo_vehi || 'Desconocido'), 
            data: stats.map(item => item.count),
        };

        res.status(200).json(chartData);
    } catch (error) {
        console.error("Error al obtener estadísticas de vehículos por tipo:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

exports.getMantenimientosPorEstado = async (req, res) => {
    try {
        const stats = await OrdenTrabajo.findAll({
            attributes: [
                'estado_ot',
                [sequelize.fn('COUNT', sequelize.col('estado_ot')), 'count']
            ],
            group: ['estado_ot'],
            raw: true
        });

        const chartData = {
            labels: stats.map(item => {
                const estado = item.estado_ot;
                return estado.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            }),
            data: stats.map(item => item.count),
        };

        res.status(200).json(chartData);
    } catch (error) {
        console.error("Error al obtener estadísticas de mantenimientos:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
