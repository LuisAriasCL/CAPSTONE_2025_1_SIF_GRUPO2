require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const sequelize = require('./config/database');

// Modelos Sequelize (asegúrate que las rutas y nombres sean correctos)
const RutaModel = require('./models/Ruta'); // Usaremos RutaModel para referirnos al modelo Sequelize de Ruta
const VehiculoModel = require('./models/Vehiculo'); // Usaremos VehiculoModel para el modelo Sequelize de Vehiculo

// Rutas API
const vehicleRoutes = require('./routes/vehiculos');
const authRoutes = require('./routes/auth');
const routeRoutes = require('./routes/rutas');

// --- Inicialización ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Considera restringir esto en producción
        methods: ["GET", "POST"]
    }
});

// --- Middlewares de Express ---
app.use(cors({ origin: "*" })); // Considera restringir esto en producción
app.use(express.json());

// Middleware para pasar 'io' a las rutas API si es necesario (ya lo tenías)
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- Conexión a Base de Datos ---
async function testDbConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la Base de Datos (Sequelize) establecida correctamente.');
    } catch (error) {
        console.error('❌ Error al conectar a la Base de Datos:', error);
    }
}
testDbConnection();

// --- Rutas de la API ---
app.get('/', (req, res) => {
    res.send('¡API de Gestión de Flota v1.0 funcionando!');
});

app.use('/api/vehicles', vehicleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rutas', routeRoutes);

// --- Lógica de Socket.IO ---
io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado a Socket.IO: ${socket.id}`);

    socket.on('disconnect', (reason) => {
        console.log(`🔌 Cliente desconectado de Socket.IO: ${socket.id}. Razón: ${reason}`);
        if (socket.simulationIntervalId) {
            clearInterval(socket.simulationIntervalId);
            console.log(`[Simulación] Intervalo de simulación detenido para socket ${socket.id} debido a desconexión.`);
            delete socket.simulationIntervalId;
        }
    });

    socket.on('startSimulation', async (data) => {
        const routeId = data?.routeId;
        const vehicleNumericId = data?.vehicleId || 1; // ID numérico del vehículo, default a 1 si no se provee

        console.log(`[Socket] Recibida petición 'startSimulation': Ruta ID=${routeId}, Vehículo ID=${vehicleNumericId}`);

        if (!routeId) {
            console.error("[Simulación] Error: No se proporcionó routeId.");
            socket.emit('simulationError', { message: 'Falta ID de la ruta para iniciar la simulación.' });
            return;
        }

        // Limpiar cualquier intervalo de simulación anterior para este socket
        if (socket.simulationIntervalId) {
            clearInterval(socket.simulationIntervalId);
            console.log(`[Simulación] Limpiando intervalo de simulación anterior para socket ${socket.id}`);
            delete socket.simulationIntervalId;
        }

        let puntosSimulacionArray = null;
        let nombreDeLaRuta = `Ruta ${routeId}`; // Nombre por defecto

        try {
            // Buscar la ruta en la base de datos usando el modelo Sequelize
            const rutaEncontrada = await RutaModel.findByPk(routeId);

            // CORRECCIÓN CLAVE: Usar los nombres de propiedad del modelo Sequelize (ej. rutaEncontrada.puntosRuta)
            if (!rutaEncontrada || !rutaEncontrada.puntosRuta) { // <--- Cambio aquí: rutaEncontrada.puntosRuta
                console.error(`[Simulación] Ruta ID ${routeId} no encontrada en la BD o no tiene la propiedad 'puntosRuta'.`);
                socket.emit('simulationError', { message: `Ruta ${routeId} no encontrada o datos de puntos ausentes.` });
                return;
            }

            nombreDeLaRuta = rutaEncontrada.nombreRuta || nombreDeLaRuta; // <--- Cambio aquí: rutaEncontrada.nombreRuta

            // Intentar parsear los puntos si son una cadena JSON, o usarlos directamente si ya son un array
            try {
                // Sequelize debería deserializar el JSON automáticamente a un objeto/array si el tipo es DataTypes.JSON
                // pero una verificación y parseo manual como tenías es una buena salvaguarda.
                puntosSimulacionArray = typeof rutaEncontrada.puntosRuta === 'string'
                    ? JSON.parse(rutaEncontrada.puntosRuta)
                    : rutaEncontrada.puntosRuta;

                if (!Array.isArray(puntosSimulacionArray) || puntosSimulacionArray.length === 0) {
                    throw new Error('Los puntos de la ruta (puntosRuta) no son un array válido o están vacíos después del parseo.');
                }
                // Opcional: Verificar que cada punto sea un array de 2 números
                if (!puntosSimulacionArray.every(p => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number')) {
                    throw new Error('Algunos puntos en puntosRuta no tienen el formato [lat, lon] esperado.');
                }

            } catch (parseError) {
                console.error(`[Simulación] Error al parsear o validar los puntos de la ruta ID ${routeId}:`, parseError, "Valor de rutaEncontrada.puntosRuta:", rutaEncontrada.puntosRuta);
                socket.emit('simulationError', { message: `Error en el formato de los puntos para la ruta ${routeId}.` });
                return;
            }

            let puntoActualIndex = 0;
            const intervaloDeSimulacionMs = 2000; // Intervalo entre actualizaciones de posición (2 segundos)

            console.log(`[Simulación] Iniciando para Ruta "${nombreDeLaRuta}" (ID ${routeId}) con ${puntosSimulacionArray.length} puntos, Vehículo ID=${vehicleNumericId}`);
            socket.emit('simulationStarted', { routeId, vehicleId: vehicleNumericId, routeName: nombreDeLaRuta });

            // Guardar el ID del intervalo en el objeto socket para poder limpiarlo
            socket.simulationIntervalId = setInterval(async () => {
                if (puntoActualIndex >= puntosSimulacionArray.length) {
                    console.log(`[Simulación] Fin para Ruta "${nombreDeLaRuta}" (ID ${routeId}), Vehículo ID=${vehicleNumericId}`);
                    if (socket.simulationIntervalId) clearInterval(socket.simulationIntervalId);
                    delete socket.simulationIntervalId;
                    io.emit('simulationEnded', { routeId, vehicleId: vehicleNumericId, routeName: nombreDeLaRuta }); // Notificar a todos los clientes
                    return;
                }

                const [latitudActual, longitudActual] = puntosSimulacionArray[puntoActualIndex];

                // Payload para el evento 'vehicleUpdated', consistente con la interfaz Vehiculo del frontend
                const datosActualizacionVehiculo = {
                    idVehi: vehicleNumericId, // El frontend espera 'idVehi'
                    latitud: latitudActual,   // El frontend espera 'latitud'
                    longitud: longitudActual, // El frontend espera 'longitud'
                    // Podrías añadir más datos del vehículo aquí si el frontend los necesita para el popup del marcador
                    // patente: vehiculoSimulado.patente, // Ejemplo si obtienes el vehículo de la BD
                    // modelo: vehiculoSimulado.modelo,   // Ejemplo
                };

                console.log(`[Simulación] Ruta "${nombreDeLaRuta}" [${puntoActualIndex + 1}/${puntosSimulacionArray.length}]: Vehículo ID=${vehicleNumericId} -> [Lat: ${latitudActual}, Lon: ${longitudActual}]`);
                io.emit('vehicleUpdated', datosActualizacionVehiculo); // Emitir a todos los clientes conectados

                // Opcional: Actualizar la base de datos con la nueva ubicación del vehículo simulado
                /*
                try {
                    if (VehiculoModel) {
                        await VehiculoModel.update(
                            { latitud: latitudActual, longitud: longitudActual }, // Campos a actualizar en la BD
                            { where: { idVehi: vehicleNumericId } } // Condición para encontrar el vehículo (PK)
                        );
                        // console.log(`[Simulación BD] Actualizada ubicación para vehículo ID ${vehicleNumericId}`);
                    }
                } catch (dbError) {
                    console.error(`[Simulación BD] Error al actualizar la BD para vehículo ID ${vehicleNumericId}:`, dbError);
                }
                */

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

    socket.on('stopSimulation', (data) => { // data podría contener { routeId, vehicleId }
        console.log(`[Socket] Recibida petición 'stopSimulation' para socket ${socket.id}`, data || '');
        if (socket.simulationIntervalId) {
            clearInterval(socket.simulationIntervalId);
            delete socket.simulationIntervalId;
            const routeIdStopped = data?.routeId || 'desconocida';
            const vehicleIdStopped = data?.vehicleId || 'desconocido';
            console.log(`[Simulación] Detenida manualmente para socket ${socket.id} (Ruta: ${routeIdStopped}, Vehículo: ${vehicleIdStopped}).`);
            socket.emit('simulationManuallyStopped', { 
                message: 'Simulación detenida manualmente.', 
                routeId: routeIdStopped, 
                vehicleId: vehicleIdStopped 
            });
        } else {
            console.log(`[Simulación] No había simulación activa para detener para socket ${socket.id}`);
            socket.emit('simulationManuallyStopped', { message: 'No había simulación activa para detener.' });
        }
    });
});

// --- Inicio del Servidor ---
const PORT = process.env.PORT || 8100;
server.listen(PORT, () => {
    console.log(`🚀 Servidor Express con Socket.IO corriendo en http://localhost:${PORT}`);
});

// Exportar 'io' puede ser útil si necesitas emitir eventos desde tus rutas API
// module.exports = { io }; // Descomenta si es necesario
