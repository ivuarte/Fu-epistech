const mysql = require('mysql2/promise');

const poolPromise = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Prueba la conexión
const testConnection = async () => {
    try {
        const connection = await poolPromise.getConnection();
        console.log('Conexión a la base de datos exitosa');
        connection.release(); // Libera la conexión si es exitosa
    } catch (error) {
        // Aquí se captura el error de conexión
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Error en la autenticación: Acceso denegado para el usuario de la base de datos.');
        } else {
            console.error('Error al conectar a la base de datos:', error.message);
        }

        // No se lanza el error para evitar que el backend se detenga
        // Si deseas implementar algún mecanismo de reintento o enviar alertas, puedes hacerlo aquí
    }
};

// Ejecuta la prueba de conexión al iniciar
testConnection();

// Exporta la conexión para su uso en otros módulos
module.exports = poolPromise;
