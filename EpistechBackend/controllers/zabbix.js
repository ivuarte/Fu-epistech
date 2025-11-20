const axios = require('axios');
const moment = require('moment-timezone');
require('dotenv').config();
const poolPromise = require('../configuraciondb');

const ZABBIX_TOKEN = process.env.ZABBIX_API_TOKEN;
const ZABBIX_URL = process.env.ZABBIX_API_URL;

let isFetchingProblems = false;

/**
 * Función interna para obtener problemas de Zabbix y guardarlos en la base de datos.
 */
const getProblemsInternal = async () => {
    if (isFetchingProblems) {
        return; // Evita ejecuciones simultáneas
    }
    isFetchingProblems = true;
    let connection;

    try {
        if (!ZABBIX_TOKEN) {
            console.error('Error: ZABBIX_API_TOKEN no está definido.');
            isFetchingProblems = false;
            return;
        }

        const url = `${ZABBIX_URL}/api_jsonrpc.php`;
        const respuesta = await axios.post(url, {
            jsonrpc: '2.0',
            method: 'problem.get',
            params: { output: 'extend', selectTags: 'extend', selectAcknowledges: 'extend', sortfield: ["eventid"] },
            id: 1,
        }, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ZABBIX_TOKEN}` }
        });

        if (respuesta.data.error) {
            console.error('Error de la API de Zabbix:', JSON.stringify(respuesta.data.error, null, 2));
            isFetchingProblems = false;
            return;
        }

        const problemas = respuesta.data.result;
        if (problemas.length === 0) {
            console.log('👍 No hay problemas activos en Zabbix.');
            isFetchingProblems = false;
            return;
        }

        connection = await poolPromise.getConnection();
        
        let newProblems = 0;
        let updatedProblems = 0;

        // Consulta SQL directa en lugar de llamar al procedimiento almacenado
        const sql = `
            INSERT INTO ProblemasZabbix (
                eventid, source, object, objectid, clock, ns,
                r_eventid, r_clock, r_ns, correlationid, userid,
                name, acknowledged, severity, cause_eventid, opdata,
                suppressed, fecha_creacion, fecha_guardado
            ) VALUES ?
            ON DUPLICATE KEY UPDATE
                acknowledged = VALUES(acknowledged),
                severity = VALUES(severity),
                opdata = VALUES(opdata),
                suppressed = VALUES(suppressed),
                fecha_guardado = VALUES(fecha_guardado);
        `;

        // Mapeamos los problemas al formato que necesita la consulta para inserción masiva
        const values = problemas.map(p => [
            p.eventid, p.source, p.object, p.objectid, p.clock, p.ns,
            p.r_eventid, p.r_clock, p.r_ns, p.correlationid, p.userid,
            p.name, p.acknowledged, p.severity, p.cause_eventid, p.opdata,
            p.suppressed,
            moment.unix(p.clock).tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss'),
            moment().format('YYYY-MM-DD HH:mm:ss')
        ]);
        
        // Ejecutamos la consulta masiva
        const [result] = await connection.query(sql, [values]);

        // affectedRows nos da una pista:
        // Si se inserta una fila, affectedRows = 1.
        // Si se actualiza una fila, affectedRows = 2.
        // Si no se hace nada (los datos son idénticos), affectedRows = 0.
        // No es perfecto, pero nos da una idea.
        if (result.affectedRows > 0) {
             console.log(`Base de datos actualizada. Filas afectadas: ${result.affectedRows}.`);
        } else {
             console.log('Datos de problemas sin cambios.');
        }

    } catch (error) {
        if (error.response) {
            console.error('Error en la respuesta de Zabbix:', error.response.status, error.response.data);
        } else {
            console.error('Error general en el proceso:', error.message);
        }
    } finally {
        if (connection) connection.release();
        isFetchingProblems = false;
    }
};

// --- Arranque y Ciclo de Ejecución ---
console.log("🚀 Aplicación iniciada. Verificando token de Zabbix...");
if (ZABBIX_TOKEN) {
    console.log("Token de Zabbix encontrado. Iniciando ciclo de obtención de problemas.");
    getProblemsInternal();
    setInterval(getProblemsInternal, 20000);
} else {
    console.log("No se encontró ZABBIX_API_TOKEN en .env. La aplicación no obtendrá datos de Zabbix.");
}

// --- Ruta para la API ---
exports.getProblems = async (req, res) => {
    await getProblemsInternal();
    res.status(200).send('Proceso de obtención de problemas ejecutado manualmente.');
};