require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const sequelize = require('./config/database');
// Asegúrate de que estos modelos sean los refactorizados a español si ya lo hiciste.
// Si Route.js y Vehicle.js todavía usan nombres en inglés, está bien para esta corrección específica,
// pero la consistencia a largo plazo es importante.
const Route = require('./models/Ruta'); // Asumiendo que este es el modelo de Ruta
const VehicleModel = require('./models/Vehiculo'); // Asumiendo que tienes un Vehiculo.js para el modelo Sequelize refactorizado

const vehicleRoutes = require('./routes/vehiculos');
const authRoutes = require('./routes/auth');
const routeRoutes = require('./routes/rutas');

// --- 2. Inicialización ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- 3. Middlewares de Express ---
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- 4. Conexión a Base de Datos ---
async function testDbConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la Base de Datos (Sequelize) establecida correctamente.');
    } catch (error) {
        console.error('❌ Error al conectar a la Base de Datos:', error);
    }
}
testDbConnection();

// --- 5. Rutas de la API ---
app.get('/', (req, res) => {
    res.send('¡API de Gestión de Flota v1.0 funcionando!');
});

app.use('/api/vehicles', vehicleRoutes); // Debería usar el modelo Vehiculo.js refactorizado
app.use('/api/auth', authRoutes);
app.use('/api/rutas', routeRoutes);

// --- 6. Lógica de Socket.IO ---
io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado a Socket.IO: ${socket.id}`);

    socket.on('disconnect', (reason) => {
        console.log(`🔌 Cliente desconectado de Socket.IO: ${socket.id}. Razón: ${reason}`);
        // Aquí podrías detener simulaciones asociadas a este socket si fuera necesario
        // Por ejemplo, si guardaste 'simulationIntervalId' en el objeto socket.
        if (socket.simulationIntervalId) {
            clearInterval(socket.simulationIntervalId);
            console.log(`[Simulación] Detenida para socket ${socket.id} debido a desconexión.`);
        }
    });

    socket.on('startSimulation', async (data) => {
        const routeId = data?.routeId;
        const vehicleNumericId = data?.vehicleId || 1; // ID numérico del vehículo de la solicitud

        console.log(`[Socket] Recibida petición 'startSimulation': Ruta ID=${routeId}, Vehículo ID=${vehicleNumericId}`);

        if (!routeId) {
            console.error("[Simulación] Error: No se proporcionó routeId.");
            socket.emit('simulationError', { message: 'Falta ID de la ruta.' });
            return;
        }

        // Limpiar cualquier intervalo anterior para este socket para evitar múltiples simulaciones
        if (socket.simulationIntervalId) {
            clearInterval(socket.simulationIntervalId);
            console.log(`[Simulación] Limpiando intervalo de simulación anterior para socket ${socket.id}`);
        }

        let puntosArray = null;
        let nombreRuta = `Ruta ${routeId}`; // Nombre por defecto

        try {
            const ruta = await Route.findByPk(routeId); // Usando el modelo Route de Sequelize

            if (!ruta || !ruta.puntos) {
                console.error(`[Simulación] Ruta ID ${routeId} no encontrada o sin puntos.`);
                socket.emit('simulationError', { message: `Ruta ${routeId} no encontrada o sin puntos.` });
                return;
            }

            nombreRuta = ruta.nombre || nombreRuta; // Usar el nombre de la ruta si existe

            try {
                puntosArray = typeof ruta.puntos === 'string' ? JSON.parse(ruta.puntos) : ruta.puntos;
                if (!Array.isArray(puntosArray) || puntosArray.length === 0) {
                    throw new Error('Los puntos de la ruta no son un array válido o están vacíos.');
                }
            } catch (parseError) {
                console.error(`[Simulación] Error al parsear los puntos de la ruta ID ${routeId}:`, parseError, "Valor de ruta.puntos:", ruta.puntos);
                socket.emit('simulationError', { message: `Error en el formato de los puntos para la ruta ${routeId}.` });
                return;
            }

            let puntoIndex = 0;
            const intervaloSimulacion = 2000; // Ajusta el intervalo según necesites

            console.log(`[Simulación] Iniciando para Ruta "${nombreRuta}" (ID ${routeId}) con Vehículo ID=${vehicleNumericId}`);
            socket.emit('simulationStarted', { routeId, vehicleId: vehicleNumericId });

            // Guardar el ID del intervalo en el objeto socket para poder limpiarlo después
            socket.simulationIntervalId = setInterval(async () => {
                if (puntoIndex >= puntosArray.length) {
                    console.log(`[Simulación] Fin para Ruta "${nombreRuta}" (ID ${routeId}), Vehículo ID=${vehicleNumericId}`);
                    if (socket.simulationIntervalId) clearInterval(socket.simulationIntervalId);
                    delete socket.simulationIntervalId; // Limpiar la propiedad
                    io.emit('simulationEnded', { routeId, vehicleId: vehicleNumericId });
                    return;
                }

                const [newLat, newLon] = puntosArray[puntoIndex];

                // --- INICIO DE LA CORRECCIÓN DEL PAYLOAD ---
                const updateData = {
                    idVehi: vehicleNumericId, // Usar 'idVehi' como espera la interfaz Vehiculo del frontend
                    latitud: newLat,        // Usar 'latitud'
                    longitud: newLon,       // Usar 'longitud'
                    // Campos adicionales para enriquecer el popup en el frontend (opcional, pero útil)
                    // Estos campos podrían obtenerse del vehículo real si fuera necesario,
                    // pero para una simulación simple, podríamos omitirlos o poner placeholders.
                    // Por ahora, solo enviamos ID y coordenadas para la actualización de posición.
                };
                // --- FIN DE LA CORRECCIÓN DEL PAYLOAD ---

                console.log(`[Simulación] Ruta "${nombreRuta}" [${puntoIndex + 1}/${puntosArray.length}]: Vehículo ID=${vehicleNumericId} a [Lat: ${newLat}, Lon: ${newLon}] (enviando como idVehi, latitud, longitud)`);
                io.emit('vehicleUpdated', updateData); // Emitir el objeto con la estructura corregida

                // Opcional: Actualizar la BD con la nueva ubicación del vehículo simulado
                // Esto haría que la simulación sea más "real" si otros clientes se conectan
                /*
                try {
                    if (VehicleModel) { // Asegurarse que el modelo Vehiculo refactorizado exista
                        await VehicleModel.update(
                            { latitud: newLat, longitud: newLon },
                            { where: { idVehi: vehicleNumericId } } // Asumiendo que tu PK es idVehi
                        );
                    }
                } catch (dbError) {
                    console.error(`[Simulación] Error al actualizar la BD para vehículo ID ${vehicleNumericId}:`, dbError);
                }
                */

                puntoIndex++;
            }, intervaloSimulacion);

        } catch (error) {
            console.error(`[Simulación] Error procesando ruta ID ${routeId}:`, error);
            socket.emit('simulationError', { message: `Error al procesar ruta ${routeId}.` });
            if (socket.simulationIntervalId) { // Usar socket.simulationIntervalId
                clearInterval(socket.simulationIntervalId);
                delete socket.simulationIntervalId;
            }
        }
    });

    // Considera añadir un listener para 'stopSimulation' si quieres controlarla desde el cliente
    socket.on('stopSimulation', (data) => {
        console.log(`[Socket] Recibida petición 'stopSimulation' para socket ${socket.id}`, data);
        if (socket.simulationIntervalId) {
            clearInterval(socket.simulationIntervalId);
            delete socket.simulationIntervalId;
            console.log(`[Simulación] Detenida manualmente para socket ${socket.id}.`);
            // Puedes emitir una confirmación si es necesario
            socket.emit('simulationManuallyStopped', { routeId: data?.routeId, vehicleId: data?.vehicleId });
        }
    });
});

const PORT = process.env.PORT || 8101;
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = { io }; // Exportar io si es necesario para otros módulos (como tus archivos de rutas)