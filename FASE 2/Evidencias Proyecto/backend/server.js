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
        const routeId = data?.routeId;
        const vehicleId = data?.vehicleId || 1; // Usar ID 1 por defecto

        console.log(`[Socket] Recibida petición 'startSimulation': Ruta ID=${routeId}, Vehículo ID=${vehicleId}`);

        if (!routeId) {
            console.error("[Simulación] Error: No se proporcionó routeId.");
            socket.emit('simulationError', { message: 'Falta ID de la ruta.' });
            return;
        }

        let simulationIntervalId = null; // ID del intervalo para esta simulación específica

        try {
            const ruta = await Route.findByPk(routeId);
    
            // --- LOGS DE DEPURACIÓN ---
            console.log(`[Sim Debug] Ruta encontrada para ID ${routeId}:`, JSON.stringify(ruta, null, 2)); // Log 2: ¿Cómo es el objeto ruta?
            if (ruta) {
                console.log(`[Sim Debug] Tipo de ruta.puntos: ${typeof ruta.puntos}`);                // Log 3: ¿Qué tipo es ruta.puntos?
                console.log(`[Sim Debug] Valor de ruta.puntos:`, ruta.puntos);                     // Log 4: ¿Cuál es su valor?
                console.log(`[Sim Debug] ¿Es ruta.puntos un Array?: ${Array.isArray(ruta.puntos)}`); // Log 5: ¿Es array antes de parsear?
            } else {
                 console.log(`[Sim Debug] ¡Ruta con ID ${routeId} NO encontrada por findByPk!`);      // Log 6: ¿No se encontró?
            }
            // --- FIN LOGS DE DEPURACIÓN ---
    
            let puntosArray = null;
            if (ruta && ruta.puntos) {
                 try {
                     puntosArray = typeof ruta.puntos === 'string' ? JSON.parse(ruta.puntos) : ruta.puntos;
                     // --- LOGS DE DEPURACIÓN ---
                     console.log(`[Sim Debug] 'puntos' parseado/obtenido como tipo: ${typeof puntosArray}, ¿es array?: ${Array.isArray(puntosArray)}`); // Log 7: ¿Tipo y array después de parsear?
                     console.log(`[Sim Debug] Longitud de puntosArray: ${Array.isArray(puntosArray) ? puntosArray.length : 'N/A'}`); // Log 8: ¿Longitud?
                     // --- FIN LOGS DE DEPURACIÓN ---
                 } catch (parseError) {
                     // --- LOG DE DEPURACIÓN ---
                     console.error(`[Sim Debug] ¡ERROR AL PARSEAR JSON!`, parseError); // Log 9: ¿Falló el parseo?
                     // --- FIN LOG DE DEPURACIÓN ---
                     puntosArray = null;
                 }
            }

            // 1.2. Validar el array parseado (puntosArray)
            if (!puntosArray || !Array.isArray(puntosArray) || puntosArray.length === 0) {
                console.error(`[Simulación] Ruta ID ${routeId} no encontrada o sin puntos válidos tras parsear/verificar.`);
                socket.emit('simulationError', { message: `Ruta ${routeId} no contiene puntos válidos.` });
                return;
            }
             // Aquí podrías añadir validación extra para asegurar que cada punto interno sea [lat, lon] si quieres más robustez
            // --- FIN: Parsear y Validar 'puntos' ---


            // 2. Iniciar el intervalo de simulación (usa puntosArray)
            let puntoIndex = 0;
            const puntosRuta = puntosArray; // <--- Usar el array parseado
            const nombreRuta = ruta.nombre;
            const intervaloSimulacion = 1000; // 3 segundos

            console.log(`[Simulación] Iniciando para Ruta "${nombreRuta}" (ID ${routeId}) con Vehículo ${vehicleId}`);
            socket.emit('simulationStarted', { routeId, vehicleId });

            const simulationStep = () => {
                if (puntoIndex >= puntosRuta.length) {
                    console.log(`[Simulación] Fin para Ruta "${nombreRuta}" (ID ${routeId}), Vehículo ${vehicleId}`);
                    if (simulationIntervalId) clearInterval(simulationIntervalId);
                    io.emit('simulationEnded', { routeId, vehicleId });
                    return;
                }

                const [newLat, newLon] = puntosRuta[puntoIndex]; // Usa puntosRuta
                const updateData = { id: vehicleId, latitude: newLat, longitude: newLon };

                console.log(`[Simulación] Ruta "${nombreRuta}" [${puntoIndex + 1}/${puntosRuta.length}]: Vehículo ${vehicleId} a [${newLat}, ${newLon}]`);
                io.emit('vehicleUpdated', updateData);

                puntoIndex++;
            };

            simulationStep(); // Primer paso inmediato
            simulationIntervalId = setInterval(simulationStep, intervaloSimulacion);

            // (Manejo opcional para detener si se desconecta, etc.)

        } catch (error) {
            console.error(`[Simulación] Error procesando ruta ID ${routeId}:`, error);
            socket.emit('simulationError', { message: `Error al procesar ruta ${routeId}.` });
            if (simulationIntervalId) clearInterval(simulationIntervalId);
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