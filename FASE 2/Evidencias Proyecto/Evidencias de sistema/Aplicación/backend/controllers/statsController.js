

const { Vehiculo, OrdenTrabajo, sequelize, Siniestro } = require('../models');
const { Op } = require('sequelize');
exports.getDashboardKpis = async (req, res) => {
    try {
        console.log("\n--- [START] Calculando KPIs para el Dashboard ---");

        // 1. Contar vehículos totales y por estado
        const totalVehiculos = await Vehiculo.count();
        console.log("Paso 1.1 - Vehículos Totales (COUNT):", totalVehiculos);
        
        const vehiculosPorEstado = await Vehiculo.findAll({
            attributes: [
                'estado_vehi',
                [sequelize.fn('COUNT', sequelize.col('estado_vehi')), 'count']
            ],
            group: ['estado_vehi']
        });
        console.log("Paso 1.2 - Vehículos Agrupados por Estado (RAW):", vehiculosPorEstado.map(v => v.toJSON()));

        // Formatear para fácil acceso
        const estadoVehiculos = vehiculosPorEstado.reduce((acc, item) => {
            acc[item.get('estado_vehi')] = parseInt(item.get('count'), 10);
            return acc;
        }, {});
        console.log("Paso 1.3 - Objeto de Estado de Vehículos (Procesado):", estadoVehiculos);

        // 2. Contar siniestros en los últimos 30 días
        const treintaDiasAtras = new Date();
        treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

        const siniestrosMes = await Siniestro.count({
            where: {
                fecha: { // Usando la propiedad correcta 'fecha'
                    [Op.gte]: treintaDiasAtras
                }
            }
        });
        console.log("Paso 2 - Siniestros del Último Mes:", siniestrosMes);

        // 3. Contar OTs pendientes
        const otsPendientes = await OrdenTrabajo.count({
            where: {
                estado_ot: { [Op.in]: ['pendiente', 'asignada', 'en_progreso'] }
            }
        });
        console.log("Paso 3 - OTs Pendientes/En Progreso:", otsPendientes);

        // --- CORRECCIÓN AQUÍ ---
        // Se usan las claves correctas que vienen del objeto 'estadoVehiculos'.
        const kpis = {
            totalVehiculos,
            vehiculosOperativos: estadoVehiculos.activo || 0,          // Cambiado de 'operativo' a 'activo'
            vehiculosEnTaller: estadoVehiculos.mantenimiento || 0, // Cambiado de 'en_mantenimiento' a 'mantenimiento'
            siniestrosMes,
            otsPendientes
        };
        
        console.log("--- [FINAL] KPIs a enviar al frontend ---", kpis);
        res.status(200).json(kpis);

    } catch (error) {
        console.error("Error al obtener KPIs del dashboard:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

exports.getVehiculosPorTipo = async (req, res) => {
  try {
    const stats = await Vehiculo.findAll({
      attributes: [
       
        'tipo_vehi', 
       
        [sequelize.fn('COUNT', sequelize.col('tipo_vehi')), 'count']
      ],
      group: ['tipo_vehi'] 
    });

  
    const chartData = {
      labels: stats.map(item => item.get('tipo_vehi')),
      data: stats.map(item => item.get('count')),
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
      group: ['estado_ot']
    });

    const chartData = {
      labels: stats.map(item => {
       
        const estado = item.get('estado_ot');
        return estado.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      }),
      data: stats.map(item => item.get('count')),
    };

    res.status(200).json(chartData);
  } catch (error) {
    console.error("Error al obtener estadísticas de mantenimientos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};