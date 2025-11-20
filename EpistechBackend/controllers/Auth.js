const moment = require('moment-timezone');
const jwt = require('jsonwebtoken');
const conn = require('../configuraciondb');

const JWT_SECRET = process.env.JWT_SECRET;

exports.auth = async (req, res) => {
    const { user, password } = req.body;
    let connection;

    try {
        connection = await conn.getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM usuarios WHERE Usuario = ?',
            [user]
        );

        if (rows.length === 1) {
            const { Id, Usuario: usuario, Password: savedPassword, Rol: rol, Estado: estado } = rows[0];

            // Comparación directa SIN bcrypt
            if (password === savedPassword) {
                if (estado === 'Activo') {
                    const nowUtc = moment.utc();
                    const nowInBogota = nowUtc.tz('America/Bogota');
                    const formattedDate = nowInBogota.format('YYYY-MM-DD HH:mm:ss');

                    await connection.execute(
                        'UPDATE usuarios SET UltimaConexion = ? WHERE Id = ?',
                        [formattedDate, Id]
                    );

                    const token = jwt.sign(
                        { Id, Usuario: usuario, Rol: rol },
                        JWT_SECRET,
                        { expiresIn: '8h' }
                    );

                    // Registrar el token activo en la base de datos
                    await connection.execute(
                        'INSERT INTO activetokens (Token, UserId) VALUES (?, ?)',
                        [token, Id]
                    );

                    // Registrar el inicio de sesión
                    await connection.execute(
                        'INSERT INTO logssesion (UserId, EventType, EventTimestamp, LogoutType) VALUES (?, ?, ?, ?)',
                        [Id, 'LOGIN', formattedDate, 'MANUAL']
                    );

                    res.json({ user: usuario, rol, token, Id });
                } else {
                    res.status(401).send('El usuario está inactivo.');
                }
            } else {
                res.status(401).send('Usuario o contraseña no válidos.');
            }
        } else {
            res.status(401).send('Usuario no válido.');
        }
    } catch (error) {
        console.error('Error en la autenticación:', error.message);
        res.status(500).send('Hubo un error: ' + error.message);
    } finally {
        if (connection) connection.release();
    }
};


exports.logout = async (req, res) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    let connection;

    try {
        connection = await conn.getConnection();

        // Eliminar el token de la base de datos
        await connection.execute(
            'DELETE FROM activetokens WHERE Token = ?',
            [token]
        );

        // Registrar el cierre de sesión manual
        const nowUtc = moment.utc();
        const nowInBogota = nowUtc.tz('America/Bogota');
        const formattedDate = nowInBogota.format('YYYY-MM-DD HH:mm:ss');

        await connection.execute(
            'INSERT INTO logssesion (UserId, EventType, EventTimestamp, LogoutType) VALUES (?, ?, ?, ?)',
            [req.user.Id, 'LOGOUT', formattedDate, 'MANUAL']
        );

        res.status(200).send('Cierre de sesión exitoso.');
    } catch (error) {
        console.error('Error al registrar el cierre de sesión:', error.message);
        res.status(500).send('Hubo un error al registrar el cierre de sesión: ' + error.message);
    } finally {
        if (connection) connection.release();
    }
};
