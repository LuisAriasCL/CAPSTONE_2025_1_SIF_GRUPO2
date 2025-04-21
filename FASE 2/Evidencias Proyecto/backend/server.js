// backend/server.js

// --- 1. Importaciones ---
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const sequelize = require('./config/database');
const Route = require('./models/Route'); // <-- IMPORTANTE: Importar modelo Route
const Vehicle = require('./models/Vehicle'); // <-- Importar si lo usas (ej. para actualizar BD en simulación opcional)
const vehicleRoutes = require('./routes/vehiculos');
const authRoutes = require('./routes/auth');
const routeRoutes = require('./routes/rutas'); // <-- Router para /api/rutas

// --- (Ya no necesitamos RUTA_SIMULADA global aquí) ---
// const RUTA_SIMULADA = [ ... ];

// --- 2. Inicialización ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Ajustar en producción
        methods: ["GET", "POST"]
    }
});

// --- 3. Middlewares de Express ---
app.use(cors({ origin: "*" })); // Habilitar CORS
app.use(express.json()); // Parsear JSON bodies

// Middleware para inyectar io
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- 4. Conexión a Base de Datos ---
async function testDbConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la Base de Datos (Sequelize) establecida correctamente.');
        // NOTA: No usar sync en producción
        // await sequelize.sync({ alter: true });
    } catch (error) {
        console.error('❌ Error al conectar a la Base de Datos:', error);
    }
}
testDbConnection();

// --- 5. Rutas de la API ---
app.get('/', (req, res) => {
    res.send('¡API de Gestión de Flota v1.0 funcionando!');
});

// Montar rutas (asegúrate que estén después de express.json y cors)
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rutas', routeRoutes); // Rutas para el CRUD de Route

// --- 6. Lógica de Socket.IO ---
io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado a Socket.IO: ${socket.id}`);

    // Listener para desconexiones (igual que antes)
    socket.on('disconnect', (reason) => {
        console.log(`🔌 Cliente desconectado de Socket.IO: ${socket.id}. Razón: ${reason}`);
        // Aquí podrías detener simulaciones asociadas a este socket si fuera necesario
    });

    // --- Listener para iniciar simulación BAJO DEMANDA ---
    socket.on('startSimulation', async (data) => {
        // data debería contener { routeId: number, vehicleId?: number }
        const routeId = data?.routeId;
        const vehicleId = data?.vehicleId || 1; // Usar ID 1 por defecto

        console.log(`[Socket] Recibida petición 'startSimulation': Ruta ID=${routeId}, Vehículo ID=${vehicleId}`);

        if (!routeId) {
            console.error("[Simulación] Error: No se proporcionó routeId.");
            socket.emit('simulationError', { message: 'Falta ID de la ruta.' }); // Informar al cliente
            return;
        }

        // Variable para guardar el ID del intervalo de esta simulación específica
        let simulationIntervalId = null;

        try {
            const ruta = await Route.findByPk(routeId);
            if (!ruta || !ruta.puntos || !Array.isArray(ruta.puntos) || ruta.puntos.length === 0) {
                console.error(`[Simulación] Ruta ID ${routeId} no encontrada o sin puntos válidos.`);
                socket.emit('simulationError', { message: `Ruta ${routeId} no encontrada o inválida.` });
                return;
            }

            let puntoIndex = 0;
            const puntosRuta = ruta.puntos;
            const nombreRuta = ruta.nombre;
            const intervaloSimulacion = 3000; // Intervalo para esta simulación (3 seg)

            console.log(`[Simulación] Iniciando para Ruta "${nombreRuta}" (ID ${routeId}) con Vehículo ${vehicleId}`);
            socket.emit('simulationStarted', { routeId, vehicleId }); // Notificar inicio al cliente

            // Función que se ejecutará en cada paso del intervalo
            const simulationStep = () => {
                if (puntoIndex >= puntosRuta.length) {
                    console.log(`[Simulación] Fin para Ruta "${nombreRuta}" (ID ${routeId}), Vehículo ${vehicleId}`);
                    if (simulationIntervalId) clearInterval(simulationIntervalId); // Detener intervalo
                    io.emit('simulationEnded', { routeId, vehicleId }); // Notificar fin a TODOS (o solo al socket)
                    return;
                }

                const [newLat, newLon] = puntosRuta[puntoIndex];
                const updateData = { id: vehicleId, latitude: newLat, longitude: newLon };

                console.log(`[Simulación] Ruta "${nombreRuta}" [${puntoIndex + 1}/${puntosRuta.length}]: Vehículo ${vehicleId} a [${newLat}, ${newLon}]`);
                io.emit('vehicleUpdated', updateData); // Emitir a TODOS

                puntoIndex++;
            };

            // Ejecutar el primer paso inmediatamente y luego iniciar intervalo
            simulationStep();
            simulationIntervalId = setInterval(simulationStep, intervaloSimulacion);

            // Guardar ID del intervalo asociado al socket para poder detenerlo si se desconecta
            // Necesitarías una forma de manejar esto si múltiples simulaciones pueden correr
            // (socket as any).currentSimulationInterval = simulationIntervalId; // Ejemplo simple

        } catch (error) {
            console.error(`[Simulación] Error procesando ruta ID ${routeId}:`, error);
            socket.emit('simulationError', { message: `Error al procesar ruta ${routeId}.` });
            if (simulationIntervalId) clearInterval(simulationIntervalId); // Asegurar detener intervalo si hay error
        }
    });
    // --- Fin Listener 'startSimulation' ---

    // Podrías añadir un listener para 'stopSimulation' aquí
    // socket.on('stopSimulation', (data) => {
    //    const intervalId = (socket as any).currentSimulationInterval;
    //    if (intervalId) {
    //        clearInterval(intervalId);
    //        console.log(`[Simulación] Detenida para socket ${socket.id}`);
    //        delete (socket as any).currentSimulationInterval;
    //        // Emitir evento de confirmación de parada
    //     }
    // });


}); // Fin de io.on('connection', ...)

// --- BLOQUE DE SIMULACIÓN AUTOMÁTICA ELIMINADO ---
// Ya no está el setInterval global aquí
// --- FIN BLOQUE ELIMINADO ---

// --- 7. Iniciar el Servidor ---
const PORT = process.env.PORT || 8100; // Asegúrate que PORT en .env sea 8100 o el que uses
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// --- 8. Exportar 'io' ---
module.exports = { io };