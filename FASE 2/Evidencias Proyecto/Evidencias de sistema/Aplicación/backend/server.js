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
const routeRoutes = require('./routes/rutas');
const asignacionRecorridoRoutes = require('./routes/asignacionesRecorrido');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use((req, res, next) => {
    req.io = io;
    next();
});

async function testDbConnectionAndSync() {
    try {
        await db.sequelize.authenticate(); // Usa db.sequelize para la instancia
        console.log('✅ Conexión a la Base de Datos (Sequelize) establecida correctamente.');
        


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
        // ... (tu lógica de disconnect)
        console.log(`🔌 Cliente desconectado de Socket.IO: ${socket.id}. Razón: ${reason}`);
        if (socket.simulationIntervalId) {
            clearInterval(socket.simulationIntervalId);
            console.log(`[Simulación] Intervalo de simulación detenido para socket ${socket.id} debido a desconexión.`);
            delete socket.simulationIntervalId;
        }
    });

    socket.on('startSimulation', async (data) => {
        const routeId = data?.routeId;
        const vehicleNumericId = data?.vehicleId || 1;

        console.log(`[Socket] Recibida petición 'startSimulation': Ruta ID=${routeId}, Vehículo ID=${vehicleNumericId}`);

        if (!routeId) {
            console.error("[Simulación] Error: No se proporcionó routeId.");
            socket.emit('simulationError', { message: 'Falta ID de la ruta para iniciar la simulación.' });
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
            // --- USA EL MODELO DESDE db ---
            const rutaEncontrada = await db.Ruta.findByPk(routeId); // <--- CAMBIO AQUÍ

            if (!rutaEncontrada || !rutaEncontrada.puntosRuta) { // Asumiendo que el modelo usa 'puntosRuta'
                console.error(`[Simulación] Ruta ID ${routeId} no encontrada en la BD o no tiene la propiedad 'puntosRuta'.`);
                socket.emit('simulationError', { message: `Ruta ${routeId} no encontrada o datos de puntos ausentes.` });
                return;
            }

            nombreDeLaRuta = rutaEncontrada.nombreRuta || nombreDeLaRuta; // Asumiendo 'nombreRuta'

            try {
                puntosSimulacionArray = typeof rutaEncontrada.puntosRuta === 'string'
                    ? JSON.parse(rutaEncontrada.puntosRuta)
                    : rutaEncontrada.puntosRuta;

                if (!Array.isArray(puntosSimulacionArray) || puntosSimulacionArray.length === 0) {
                    throw new Error('Los puntos de la ruta (puntosRuta) no son un array válido o están vacíos después del parseo.');
                }
                if (!puntosSimulacionArray.every(p => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number')) {
                    throw new Error('Algunos puntos en puntosRuta no tienen el formato [lat, lon] esperado.');
                }

            } catch (parseError) {
                console.error(`[Simulación] Error al parsear o validar los puntos de la ruta ID ${routeId}:`, parseError, "Valor de rutaEncontrada.puntosRuta:", rutaEncontrada.puntosRuta);
                socket.emit('simulationError', { message: `Error en el formato de los puntos para la ruta ${routeId}.` });
                return;
            }

            let puntoActualIndex = 0;
            const intervaloDeSimulacionMs = 2000;

            console.log(`[Simulación] Iniciando para Ruta "${nombreDeLaRuta}" (ID ${routeId}) con ${puntosSimulacionArray.length} puntos, Vehículo ID=${vehicleNumericId}`);
            socket.emit('simulationStarted', { routeId, vehicleId: vehicleNumericId, routeName: nombreDeLaRuta });

            socket.simulationIntervalId = setInterval(async () => {
                if (puntoActualIndex >= puntosSimulacionArray.length) {
                    // ... (lógica de fin de simulación)
                    console.log(`[Simulación] Fin para Ruta "${nombreDeLaRuta}" (ID ${routeId}), Vehículo ID=${vehicleNumericId}`);
                    if (socket.simulationIntervalId) clearInterval(socket.simulationIntervalId);
                    delete socket.simulationIntervalId;
                    io.emit('simulationEnded', { routeId, vehicleId: vehicleNumericId, routeName: nombreDeLaRuta });
                    return;
                }

                const [latitudActual, longitudActual] = puntosSimulacionArray[puntoActualIndex];
                const datosActualizacionVehiculo = {
                    idVehi: vehicleNumericId,
                    latitud: latitudActual,
                    longitud: longitudActual,
                };

            

                console.log(`[Simulación] Ruta "${nombreDeLaRuta}" [${puntoActualIndex + 1}/${puntosSimulacionArray.length}]: Vehículo ID=${vehicleNumericId} -> [Lat: ${latitudActual}, Lon: ${longitudActual}]`);
                io.emit('vehicleUpdated', datosActualizacionVehiculo);
                puntoActualIndex++;
            }, intervaloDeSimulacionMs);

        } catch (error) {
            console.error(`[Simulación] Error general procesando la simulación para ruta ID ${routeId}:`, error);
            socket.emit('simulationError', { message: `Error interno al procesar la simulación para ruta ${routeId}.` });
            if (socket.simulationIntervalId) {
                clearInterval(socket.simulationIntervalId);
                delete socket.simulationIntervalId;
            }
        }
    });

    socket.on('stopSimulation', (data) => {
        // ... (tu lógica de stopSimulation)
    });
});


const PORT = process.env.PORT || 8100;
server.listen(PORT, () => {
    console.log(`🚀 Servidor Express con Socket.IO corriendo en http://localhost:${PORT}`);
});


