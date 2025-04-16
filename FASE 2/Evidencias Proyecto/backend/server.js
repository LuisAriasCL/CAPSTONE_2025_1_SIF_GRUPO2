
require('dotenv').config(); 
const express = require('express');
const http = require('http'); 
const cors = require('cors');
const { Server } = require("socket.io"); 
const sequelize = require('./config/database'); 

const vehicleRoutes = require('./routes/vehiculos');

const authRoutes = require('./routes/auth'); 

const app = express(); 
const server = http.createServer(app); 
const io = new Server(server, { 
    cors: {
        origin: "*", // Permitir conexiones desde cualquier origen (¡AJUSTAR EN PRODUCCIÓN!)
        methods: ["GET", "POST"] 
    }
});

// --- 3. Middlewares de Express ---
// Habilitar CORS para todas las rutas de la API REST
app.use(cors({ origin: "*" })); // ¡AJUSTAR EN PRODUCCIÓN! (ej. "http://localhost:8100")

// Permitir que Express parsee JSON en el body de las peticiones
app.use(express.json());

// Middleware para inyectar la instancia 'io' en cada petición (req)
// Esto permite que las rutas puedan emitir eventos de Socket.IO fácilmente
app.use((req, res, next) => {
    req.io = io;
    next(); 
});

//hola
async function testDbConnection() {
    try {
        await sequelize.authenticate(); 
        console.log('✅ Conexión a la Base de Datos (Sequelize) establecida correctamente.');

        // NOTA SOBRE SYNC: sequelize.sync() puede crear/alterar tablas.
        // Es útil en desarrollo temprano, pero peligroso en producción.
        // Es mejor usar Migraciones de Sequelize para cambios de schema.
        // await sequelize.sync({ alter: true }); // Descomentar con precaución
    } catch (error) {
        console.error('❌ Error al conectar a la Base de Datos:', error);
        // Podríamos decidir terminar el proceso si la BD no está disponible
        // process.exit(1);
    }
}
testDbConnection(); 
// --- 5. Rutas de la API ---
// Ruta simple para probar que el servidor funciona
app.get('/', (req, res) => {
    res.send('¡API de Gestión de Flota v1.0 funcionando!');
});

// Montar las rutas de vehículos (cuando las creemos)
// Todas las rutas definidas en './routes/vehicles' estarán bajo '/api/vehicles'
app.use('/api/vehicles', vehicleRoutes); 
app.use('/api/auth', authRoutes);
// --- 6. Lógica de Socket.IO ---
io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado a Socket.IO: ${socket.id}`);

    // Aquí podríamos enviar datos iniciales al cliente si fuera necesario
    // socket.emit('welcome', { message: 'Bienvenido al servicio de flota!' });

    // Manejar desconexiones
    socket.on('disconnect', (reason) => {
        console.log(`🔌 Cliente desconectado de Socket.IO: ${socket.id}. Razón: ${reason}`);
    });

    // Podríamos escuchar otros eventos personalizados del cliente aquí
    // socket.on('miEventoCustom', (data) => { ... });
});

// --- 7. Iniciar el Servidor ---
const PORT = process.env.PORT || 3000; // Usar puerto de .env o 3000 por defecto
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// --- 8. Exportar 'io' (opcional, ya que lo inyectamos en req) ---
module.exports = { io };