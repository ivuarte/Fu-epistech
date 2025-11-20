const conn = require('../configuraciondb');
const moment = require('moment-timezone');

exports.createUser = async (req, res) => {
    const { Nombre, identificacion, Usuario, Password, Estado, Rol, Correo } = req.body;
    let connection;

    try {
        if (!Nombre || !Usuario || !Password || !Estado || !Rol || !Correo) {
            return res.status(400).send('Todos los campos son requeridos.');
        }

        connection = await conn.getConnection();

        // Guardar la contraseña directamente (no encriptada)
        const [result] = await connection.execute(
            'CALL sp_CrearUsuario(?, ?, ?, ?, ?, ?, ?)',
            [Nombre, identificacion, Usuario, Password, Estado, Rol, Correo]
        );

        if (result && result.affectedRows && result.affectedRows > 0) {
            res.status(201).send('Usuario creado exitosamente.');
        } else if (result && result[0] && result[0].length > 0) {
            res.status(201).send('Usuario creado exitosamente.');
        } else {
            res.status(400).send('No se pudo crear el usuario.');
        }
    } catch (error) {
        console.log('Error al crear usuario:', error.message);
        res.status(500).send('Hubo un error al crear el usuario: ' + error.message);
    } finally {
        if (connection) connection.release();
    }
};

exports.cambiarEstado = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    let connection;

    if (!estado) {
        return res.status(400).send('El estado es requerido.');
    }

    try {
        connection = await conn.getConnection();

        const [result] = await connection.execute(
            'CALL sp_CambiarEstadoUsuario(?, ?)',
            [id, estado]
        );

        res.status(200).send(`Estado cambiado a ${estado} correctamente.`);
    } catch (error) {
        console.error('Error al cambiar estado:', error.message);
        if (error.sqlMessage === 'Usuario no encontrado') {
            return res.status(404).send('Usuario no encontrado.');
        }
        res.status(500).send('Hubo un error: ' + error.message);
    } finally {
        if (connection) connection.release();
    }
};

exports.cambiarContrasena = async (req, res) => {
    const { id } = req.params;
    const { nuevaContrasena } = req.body;

    if (!nuevaContrasena) {
        return res.status(400).send('La nueva contraseña es requerida.');
    }

    let connection;

    try {
        connection = await conn.getConnection();

        // Guardar la nueva contraseña sin encriptar
        await connection.execute(
            'UPDATE usuarios SET Password = ? WHERE Id = ?',
            [nuevaContrasena, id]
        );

        res.status(200).send('Contraseña cambiada correctamente.');
    } catch (error) {
        console.error('Error al cambiar la contraseña:', error.message);
        res.status(500).send('Hubo un error: ' + error.message);
    } finally {
        if (connection) connection.release();
    }
};

exports.getTodosUsuarios = async (req, res) => {
    let connection;

    try {
        connection = await conn.getConnection();
        const [results] = await connection.query('CALL sp_ObtenerUsuarios()');
        const [rows] = results;

        const usuarios = rows.map(record => {
            const originalDate = record.UltimaConexion;
            const localDate = originalDate
                ? moment.utc(originalDate).tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss')
                : null;

            return {
                ...record,
                UltimaConexion: localDate
            };
        });

        res.status(200).json(usuarios);
    } catch (error) {
        console.error('Error al obtener la lista de usuarios:', error.message);
        res.status(500).send('Hubo un error al obtener la lista de usuarios.');
    } finally {
        if (connection) connection.release();
    }
};

exports.getUsuariosDisponibles = async (req, res) => {
    let connection;

    try {
        connection = await conn.getConnection();
        
        // Una consulta simple para obtener usuarios activos. Puedes hacerla más compleja si lo necesitas.
        const [rows] = await connection.query(
            "SELECT Id, Nombre, Correo, Telefono, Area FROM usuarios WHERE Estado = 'Activo'"
        );
        
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error al obtener usuarios disponibles:', error.message);
        res.status(500).send('Hubo un error al obtener la lista de usuarios.');
    } finally {
        if (connection) connection.release();
    }
};
