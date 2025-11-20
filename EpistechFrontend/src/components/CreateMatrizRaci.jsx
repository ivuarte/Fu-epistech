import { useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import styled from 'styled-components';
import axios from 'axios';
import { MultiSelect } from 'primereact/multiselect';
import 'primereact/resources/themes/saga-blue/theme.css'; 
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const FormContent = styled.div`
  width: 100%;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  box-sizing: border-box;
  text-align: center;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  text-align: left;
  margin-bottom: 10px;
  color: #333;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
`;

const ErrorMsg = styled.p`
  color: red;
  margin-bottom: 20px;
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: #0056b3;
  }
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const levels = [
  { label: 'Nivel 1', value: 'Nivel 1' },
  { label: 'Nivel 2', value: 'Nivel 2' },
  { label: 'Nivel 3', value: 'Nivel 3' }
];

const CreateMatrizRaci = ({ onSuccess }) => {
  const [userData, setUserData] = useState({
    Nombre: '',
    Nivel: [],
    FechaInicioDisponibilidad: '',
    FechaFinDisponibilidad: '',
    TipoComunicacion: [],
    Telefono: '',
    Correo: '',
    Disponible: true,
    Administrador: '', // Se establecerá más tarde
    Clasificacion: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

  

    setError('');
    setUserData(prevUserData => ({
      ...prevUserData,
      [name]: value,
    }));
  };

  const handleMultiSelectChange = (e, field) => {
    setUserData(prevUserData => ({
      ...prevUserData,
      [field]: e.value
    }));
  };

  const validateDates = () => {
    const today = new Date().toISOString().split('T')[0];
    const startDate = new Date(userData.FechaInicioDisponibilidad).toISOString().split('T')[0];
    const endDate = new Date(userData.FechaFinDisponibilidad).toISOString().split('T')[0];

    if (startDate < today) {
      setError('La fecha de inicio debe ser igual o mayor a hoy.');
      return false;
    }

    if (endDate <= startDate) {
      setError('La fecha de fin debe ser mayor a la fecha de inicio.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateDates()) return;

    try {
      const userDataToSend = {
        ...userData,
        Administrador: 'Nombre del Administrador', // Este valor debe ser dinámico basado en el usuario autenticado
        Nivel: userData.Nivel.join(','), // Convierte el array en una cadena separada por comas
      };

      console.log('Datos enviados:', userDataToSend); // Verifica los datos en la consola

      const response = await axios('http://52.190.10.138:4000/api/disponibles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userDataToSend),
      });

      if (response.ok) {
        setUserData({
          Nombre: '',
          Nivel: [],
          FechaInicioDisponibilidad: '',
          FechaFinDisponibilidad: '',
          TipoComunicacion: [],
          Telefono: '',
          Correo: '',
          Disponible: true,
          Administrador: '',
          Clasificacion: ''
        });
        onSuccess();
        Swal.fire({
          icon: 'success',
          title: 'Registro creado',
          text: 'El registro se ha creado correctamente.',
        });
      } else {
        const errorData = await response.json();
        setError(`Error: ${errorData.message || 'Hubo un error al crear el registro.'}`);
        Swal.fire({
          icon: 'error',
          title: 'Error al crear registro',
          text: errorData.message || 'Hubo un error al crear el registro. Por favor, inténtelo de nuevo.',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al crear registro',
        text: 'Hubo un error al crear el registro. Por favor, inténtelo de nuevo.',
      });
    }
  };

  return (
    <FormContent>
      <Title>Crear Registro de Disponibilidad</Title>
      <form onSubmit={handleSubmit}>
        <Label>
          Nombre:
          <Input
            type="text"
            name="Nombre"
            value={userData.Nombre}
            onChange={handleChange}
          />
        </Label>
        <Label>
          Nivel:
          <MultiSelect
            value={userData.Nivel}
            options={levels}
            onChange={(e) => handleMultiSelectChange(e, 'Nivel')}
            placeholder="Seleccione Nivel"
            style={{ width: '100%' }}
          />
        </Label>
        <Label>
          Fecha Inicio Disponibilidad:
          <Input
            type="datetime-local"
            name="FechaInicioDisponibilidad"
            value={userData.FechaInicioDisponibilidad}
            onChange={handleChange}
          />
        </Label>
        <Label>
          Fecha Fin Disponibilidad:
          <Input
            type="datetime-local"
            name="FechaFinDisponibilidad"
            value={userData.FechaFinDisponibilidad}
            onChange={handleChange}
          />
        </Label>
        <Label>
          Tipo de Comunicación:
          <MultiSelect
            value={userData.TipoComunicacion}
            options={[
              { label: 'Teléfono', value: 'Teléfono' },
              { label: 'Correo', value: 'Correo' },
              { label: 'SMS', value: 'SMS' }
            ]}
            onChange={(e) => handleMultiSelectChange(e, 'TipoComunicacion')}
            placeholder="Seleccione Tipo de Comunicación"
            style={{ width: '100%' }}
          />
        </Label>
        <Label>
          Teléfono:
          <Input
            type="text"
            name="Telefono"
            value={userData.Telefono}
            onChange={handleChange}
          />
        </Label>
        <Label>
          Correo:
          <Input
            type="email"
            name="Correo"
            value={userData.Correo}
            onChange={handleChange}
          />
        </Label>
        <Label>
          Clasificación:
          <Input
            type="text"
            name="Clasificacion"
            value={userData.Clasificacion}
            onChange={handleChange}
          />
        </Label>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <Button type="submit" disabled={!userData.Nombre || !userData.FechaInicioDisponibilidad || !userData.FechaFinDisponibilidad}>
          Crear Registro
        </Button>
      </form>
    </FormContent>
  );
};

CreateMatrizRaci.propTypes = {
  onSuccess: PropTypes.func.isRequired,
};

export default CreateMatrizRaci;
