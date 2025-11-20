const conn = require('../configuraciondb');
const moment = require('moment');

exports.obtenerDisponibles = async (req, res) => {
  let connection;
  try {
    connection = await conn.getConnection();
    const [rows] = await connection.query('SELECT * FROM disponibles');
    const formattedRows = rows.map(row => ({
      ...row,
      FechaInicioDisponibilidad: row.FechaInicioDisponibilidad ? moment(row.FechaInicioDisponibilidad).format('YYYY-MM-DD HH:mm:ss') : null,
      FechaFinDisponibilidad: row.FechaFinDisponibilidad ? moment(row.FechaFinDisponibilidad).format('YYYY-MM-DD HH:mm:ss') : null,
    }));
    res.status(200).json(formattedRows);
  } catch (error) {
    console.error('Error al obtener disponibles:', error.message);
    res.status(500).send('Error al obtener los registros de disponibilidad.');
  } finally {
    if (connection) connection.release();
  }
};

exports.actualizarDisponible = async (req, res) => {
  let connection;
  const id = req.params.id;
  const fields = req.body;

  if (!id || Object.keys(fields).length === 0) {
    return res.status(400).json({ message: 'Datos insuficientes para actualizar.' });
  }

  try {
    connection = await conn.getConnection();

    // Construcción dinámica del UPDATE
    const updates = [];
    const values = [];

    for (const key in fields) {
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }

    const sql = `UPDATE disponibles SET ${updates.join(', ')} WHERE Id = ?`;
    values.push(id);

    const [result] = await connection.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Registro no encontrado.' });
    }

    res.status(200).json({ message: 'Registro actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar disponible:', error.message);
    res.status(500).json({ message: 'Error al actualizar el registro.' });
  } finally {
    if (connection) connection.release();
  }
};

exports.eliminarDisponible = async (req, res) => {
  let connection;
  const id = req.params.id;

  try {
    connection = await conn.getConnection();
    const [result] = await connection.query('DELETE FROM disponibles WHERE Id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Registro no encontrado.' });
    }

    res.status(200).json({ message: 'Registro eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar disponible:', error.message);
    res.status(500).json({ message: 'Error al eliminar el registro.' });
  } finally {
    if (connection) connection.release();
  }
};



exports.crearDisponible = async (req, res) => {
  let connection;
  const {
    Nombre,
    Nivel,
    FechaInicioDisponibilidad,
    FechaFinDisponibilidad,
    TipoComunicacion,
    Contacto,
    Disponible
  } = req.body;

  try {
    connection = await conn.getConnection();

    // Formatear fechas a formato MySQL DATETIME
    const fechaInicio = FechaInicioDisponibilidad ? moment(FechaInicioDisponibilidad).format('YYYY-MM-DD HH:mm:ss') : null;
    const fechaFin = FechaFinDisponibilidad ? moment(FechaFinDisponibilidad).format('YYYY-MM-DD HH:mm:ss') : null;

    const result = await connection.query(
      `INSERT INTO disponibles (Nombre, Nivel, FechaInicioDisponibilidad, FechaFinDisponibilidad, TipoComunicacion, Contacto, Disponible)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Nombre || '',
        Array.isArray(Nivel) ? Nivel[0] : Nivel,
        fechaInicio,
        fechaFin,
        Array.isArray(TipoComunicacion) ? TipoComunicacion[0] : TipoComunicacion,
        Contacto || null,
        Disponible ? 1 : 0
      ]
    );

    res.status(201).json({ message: 'Registro creado correctamente.' });
  } catch (error) {
    console.error('Error al crear disponible:', error.message);
    res.status(500).json({ message: 'Error al crear el registro.' });
  } finally {
    if (connection) connection.release();
  }
};
