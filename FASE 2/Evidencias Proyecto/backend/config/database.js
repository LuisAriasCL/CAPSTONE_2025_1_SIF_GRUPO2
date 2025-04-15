// backend/config/database.js


require('dotenv').config();


const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,    // Nombre de la base de datos
    process.env.DB_USER,    // Usuario de la base de datos
    process.env.DB_PASSWORD,// Contraseña de la base de datos
    {
        host: process.env.DB_HOST,      // Dirección del servidor de la BD (localhost)
        dialect: process.env.DB_DIALECT,// Tipo de base de datos (mysql)
        logging: false, // Desactiva los mensajes SQL en consola. Pon console.log para verlos.
                        // Muy útil para depurar, pero ensucia la consola.
        pool: { // Opcional: Configuración del pool de conexiones
          max: 5,     // Máximo de conexiones activas
          min: 0,     // Mínimo de conexiones inactivas
          acquire: 30000, // Tiempo máximo (ms) para intentar obtener una conexión antes de lanzar error
          idle: 10000   // Tiempo máximo (ms) que una conexión puede estar inactiva antes de ser liberada
        }
    }
);

// 4. Exportar la instancia de Sequelize configurada
// Otros archivos podrán importar esta instancia para interactuar con la BD
module.exports = sequelize;