// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");

const db = require('./models');

// Rutas API
const vehicleRoutes = require('./routes/vehiculos');
const authRoutes = require('./routes/auth');
const routeRoutes = require('./routes/rutas'); // Asegúrate que este archivo exporte las rutas de /api/rutas
const asignacionRecorridoRoutes = require('./routes/asignacionesRecorrido');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Considera restringir esto en producción
        methods: ["GET", "POST"]
    }
});

app.use(cors({ origin: "*" })); // Considera restringir esto en producción
app.use(express.json());

// Middleware para pasar 'io' a las rutas API (si lo necesitas allí para emitir eventos desde las rutas)
app.use((req, res, next) => {
    req.io = io;
    next();
});

async function testDbConnectionAndSync() {
    try {
        await db.sequelize.authenticate();
        console.log('✅ Conexión a la Base de Datos (Sequelize) establecida correctamente.');
        // await db.sequelize.sync({ alter: true }); // Cuidado con alter:true en producción
        // console.log('🔄 Modelos sincronizados con la Base de Datos.');
    } catch (error) {
        console.error('❌ Error al conectar o sincronizar con la Base de Datos:', error);
    }
}
testDbConnectionAndSync();

app.get('/', (req, res) => {
    res.send('¡API de Gestión de Flota v1.0 funcionando!');
});

app.use('/api/vehicles', vehicleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rutas', routeRoutes);
app.use('/api/asignaciones-recorrido', asignacionRecorridoRoutes);

// Lógica de Socket.IO
io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado a Socket.IO: ${socket.id}`);

    socket.on('disconnect', (reason) => {
        console.log(`🔌 Cliente desconectado de Socket.IO: ${socket.id}. Razón: ${reason}`);
        if (socket.simulationIntervalId) {
            clearInterval(socket.simulationIntervalId);
            console.log(`[Simulación] Intervalo de simulación detenido para socket ${socket.id} debido a desconexión.`);
            delete socket.simulationIntervalId;
        }
        // Si te unes a rooms, aquí podrías querer limpiar la pertenencia a rooms del socket
    });

    // (Opcional) Suscripción a un room específico de asignación
    socket.on('subscribeToAsignacion', (data) => {
        const asignacionId = data?.asignacionId;
        if (asignacionId) {
            const roomName = `asignacion_${asignacionId}`;
            socket.join(roomName);
            console.log(`[Socket] Cliente ${socket.id} se unió al room ${roomName}`);
            // Podrías emitir un evento de confirmación si es necesario
            // socket.emit('subscribedToAsignacion', { asignacionId, roomName });
        } else {
            console.warn(`[Socket] Intento de suscripción sin asignacionId por cliente ${socket.id}`);
        }
    });

    // (Opcional) Desuscripción de un room específico de asignación
    socket.on('unsubscribeFromAsignacion', (data) => {
        const asignacionId = data?.asignacionId;
        if (asignacionId) {
            const roomName = `asignacion_${asignacionId}`;
            socket.leave(roomName);
            console.log(`[Socket] Cliente ${socket.id} abandonó el room ${roomName}`);
        }
    });


    socket.on('startSimulation', async (data) => {
        const routeId = data?.routeId;
        const vehicleNumericId = data?.vehicleId; // No pongas un valor por defecto aquí, debe venir del cliente
        const asignacionIdSimulacion = data?.asignacionId; // NUEVO: Recibir asignacionId para el contexto

        console.log(`[Socket] Recibida petición 'startSimulation': Ruta ID=${routeId}, Vehículo ID=${vehicleNumericId}, Asignación ID=${asignacionIdSimulacion}`);

        if (!routeId || vehicleNumericId === undefined) { // Asegurar que vehicleId también esté presente
            console.error("[Simulación] Error: No se proporcionó routeId o vehicleId.");
            socket.emit('simulationError', { message: 'Falta ID de la ruta o ID del vehículo para iniciar la simulación.' });
            return;
        }

        if (socket.simulationIntervalId) {
            clearInterval(socket.simulationIntervalId);
            console.log(`[Simulación] Limpiando intervalo de simulación anterior para socket ${socket.id}`);
            delete socket.simulationIntervalId;
        }

        let puntosSimulacionArray = null;
        let nombreDeLaRuta = `Ruta ${routeId}`;

        try {
            const rutaEncontrada = await db.Ruta.findByPk(routeId);

            if (!rutaEncontrada || !rutaEncontrada.puntosRuta) {
                console.error(`[Simulación] Ruta ID ${routeId} no encontrada o no tiene 'puntosRuta'.`);
                socket.emit('simulationError', { message: `Ruta ${routeId} no encontrada o datos de puntos ausentes.` });
                return;
            }
            nombreDeLaRuta = rutaEncontrada.nombreRuta || nombreDeLaRuta;

            try {
                puntosSimulacionArray = typeof rutaEncontrada.puntosRuta === 'string'
                    ? JSON.parse(rutaEncontrada.puntosRuta)
                    : rutaEncontrada.puntosRuta;

                if (!Array.isArray(puntosSimulacionArray) || puntosSimulacionArray.length === 0 ||
                    !puntosSimulacionArray.every(p => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number')) {
                    throw new Error('Los puntos de la ruta (puntosRuta) no son un array válido de coordenadas [[lat,lng],...] o están vacíos.');
                }
            } catch (parseError) {
                console.error(`[Simulación] Error al parsear/validar puntos de ruta ID ${routeId}:`, parseError, "Valor:", rutaEncontrada.puntosRuta);
                socket.emit('simulationError', { message: `Error en el formato de los puntos para la ruta ${routeId}.` });
                return;
            }

            let puntoActualIndex = 0;
            const intervaloDeSimulacionMs = 2000;

            console.log(`[Simulación] Iniciando para Ruta "${nombreDeLaRuta}" (ID ${routeId}), Vehículo ID=${vehicleNumericId}, Asignación ID=${asignacionIdSimulacion}, con ${puntosSimulacionArray.length} puntos.`);
            socket.emit('simulationStarted', { routeId, vehicleId: vehicleNumericId, asignacionId: asignacionIdSimulacion, routeName: nombreDeLaRuta });

            socket.simulationIntervalId = setInterval(async () => {
                if (puntoActualIndex >= puntosSimulacionArray.length) {
                    console.log(`[Simulación] Fin para Ruta "${nombreDeLaRuta}", Vehículo ID=${vehicleNumericId}, Asignación ID=${asignacionIdSimulacion}`);
                    if (socket.simulationIntervalId) clearInterval(socket.simulationIntervalId);
                    delete socket.simulationIntervalId;
                    
                    const endData = { routeId, vehicleId: vehicleNumericId, asignacionId: asignacionIdSimulacion, routeName: nombreDeLaRuta };
                    if (asignacionIdSimulacion) {
                        io.to(`asignacion_${asignacionIdSimulacion}`).emit('simulationEnded', endData);
                    } else {
                        io.emit('simulationEnded', endData); // O a un room general si no hay asignacionId
                    }
                    return;
                }

                const [latitudActual, longitudActual] = puntosSimulacionArray[puntoActualIndex];
                const datosActualizacionVehiculo = {
                    idVehi: vehicleNumericId, // Asegúrate que coincida con la PK de tu modelo Vehiculo
                    latitud: latitudActual,
                    longitud: longitudActual,
                    asignacionId: asignacionIdSimulacion, // Incluir asignacionId
                    // Podrías obtener y enviar el estado actual del vehículo desde la BD si lo necesitas
                    // const vehiculoDB = await db.Vehiculo.findByPk(vehicleNumericId);
                    // estadoVehi: vehiculoDB ? vehiculoDB.estadoVehi : 'desconocido',
                    // patente: vehiculoDB ? vehiculoDB.patente : 'N/A',
                };

                console.log(`[Simulación] Ruta "${nombreDeLaRuta}" [${puntoActualIndex + 1}/${puntosSimulacionArray.length}]: Vehículo ID=${vehicleNumericId} -> [Lat: ${latitudActual}, Lon: ${longitudActual}], Asignación ID=${asignacionIdSimulacion}`);
                
                // Emitir al room específico si asignacionIdSimulacion está presente, sino a todos.
                if (asignacionIdSimulacion) {
                    io.to(`asignacion_${asignacionIdSimulacion}`).emit('vehicleUpdated', datosActualizacionVehiculo);
                } else {
                    io.emit('vehicleUpdated', datosActualizacionVehiculo); // Fallback si no hay asignacionId
                }
                puntoActualIndex++;
            }, intervaloDeSimulacionMs);

        } catch (error) {
            console.error(`[Simulación] Error general procesando simulación para ruta ID ${routeId}:`, error);
            socket.emit('simulationError', { message: `Error interno al procesar simulación para ruta ${routeId}.` });
            if (socket.simulationIntervalId) {
                clearInterval(socket.simulationIntervalId);
                delete socket.simulationIntervalId;
            }
        }
    });

    socket.on('stopSimulation', (data) => {
        const vehicleId = data?.vehicleId; // O como identifiques la simulación a detener
        console.log(`[Socket] Recibida petición 'stopSimulation' para vehículo ${vehicleId} (o simulación de este socket)`);
        if (socket.simulationIntervalId) {
            clearInterval(socket.simulationIntervalId);
            delete socket.simulationIntervalId;
            socket.emit('simulationStopped', { message: 'Simulación detenida por el cliente.', vehicleId });
            console.log(`[Simulación] Detenida para socket ${socket.id}`);
        } else {
            socket.emit('simulationError', { message: 'No hay simulación activa en este socket para detener.' });
        }
    });
});

const PORT = process.env.PORT || 8100; // Cambiado el puerto a 3000, 8100 es común para Ionic serve
server.listen(PORT, () => {
    console.log(`🚀 Servidor Express con Socket.IO corriendo en http://localhost:${PORT}`);
});