

const { Vehiculo, OrdenTrabajo, sequelize } = require('../models');



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