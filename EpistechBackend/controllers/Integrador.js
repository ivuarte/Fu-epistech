const mysql = require('mysql2/promise');
const moment = require('moment'); // Importar la biblioteca moment
const conn = require('../configuraciondb'); // Archivo de configuración de la conexión
//const { obtenerProblemasNoGestionados, obtenerConteoEventosPorHora, gestionarProblema } = require('../controllers/Integrador');


exports.obtenerProblemasNoGestionados = async (req, res) => {
    let connection;
    try {
        connection = await conn.getConnection();
        // Esta consulta ahora solo trae los problemas que NO están en la tabla GestionEventos
        const [rows] = await connection.query(`
            SELECT pz.*, 'Zabbix' as fuente 
            FROM ProblemasZabbix pz
            LEFT JOIN GestionEventos ge ON pz.eventid = ge.eventid
            WHERE ge.eventid IS NULL;
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener problemas no gestionados:', error.message);
        res.status(500).send('Hubo un error al obtener los problemas no gestionados.');
    } finally {
        if (connection) connection.release();
    }
};


exports.obtenerConteoEventosPorHora = async (req, res) => {
    let connection;
    try {
        // Obtenemos la fecha que envía el frontend (ej: '2025-07-26')
        const { fecha } = req.query;

        // Verificamos que la fecha exista, si no, usamos el día de hoy.
        if (!fecha) {
            return res.status(400).send('Se requiere un parámetro de fecha.');
        }

        connection = await conn.getConnection();

        // Ejecutamos el procedimiento almacenado y le pasamos la fecha
        const [rows] = await connection.query('CALL sp_ConteoEventosPorHora(?)', [fecha]);

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener conteo de eventos por hora:', error.message);
        res.status(500).send('Hubo un error al obtener el conteo de eventos por hora.');
    } finally {
        if (connection) connection.release();
    }
};

exports.gestionarProblema = async (req, res) => {
    const { eventid } = req.params;
    const { comentario, responsable, clienteImpactado, sistemaImpactado, IdUser } = req.body;
    let connection;

    try {
        connection = await conn.getConnection();
        
        // Inserta los detalles de la gestión en la nueva tabla
        const [result] = await connection.query(
            'INSERT INTO GestionEventos (eventid, comentario, responsable, clienteImpactado, sistemaImpactado, IdUser) VALUES (?, ?, ?, ?, ?, ?)', 
            [eventid, comentario, responsable, clienteImpactado, sistemaImpactado, IdUser]
        );

        if (result.affectedRows > 0) {
            console.log(`Gestión del evento ${eventid} registrada por usuario ${IdUser}`);
            res.status(200).send('Evento gestionado y registrado correctamente.');
        } else {
            res.status(500).send('No se pudo registrar la gestión del evento.');
        }
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).send('Este evento ya ha sido gestionado previamente.');
        }
        console.error('Error al gestionar el problema:', error.message);
        res.status(500).send('Hubo un error al gestionar el problema.');
    } finally {
        if (connection) connection.release();
    }
};

