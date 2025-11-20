import { useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import styled from 'styled-components';

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

const Select = styled.select`
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

const CreateUserForm = ({ onSuccess }) => {
  const [userData, setUserData] = useState({ 
    Nombre: '', 
    identificacion: '', 
    Usuario: '', 
    Password: '', 
    Estado: 'Activo', 
    Rol: 'General', 
    Correo: '' 
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError(''); // Limpia el error al cambiar
    if (name === 'identificacion' && value && !/^\d+$/.test(value)) {
      setError('La identificación solo puede contener números.');
    }
    setUserData((prev) => ({ ...prev, [name]: value, }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // --- ESTA ES LA CORRECCIÓN CLAVE ---
      // Obtener el token del localStorage
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://52.190.10.138:4000/api/usuarios/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Usar la variable token que acabamos de definir
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(userData),
      });
  
      if (response.ok) {
        setUserData({ Nombre: '', identificacion: '', Usuario: '', Password: '', Estado: 'Activo', Rol: 'General', Correo: '' });
        onSuccess();
        Swal.fire({
          icon: 'success',
          title: 'Usuario creado',
          text: 'El usuario se ha creado correctamente.',
        });
      } else {
        const data = await response.json();
        const errorMessage = data.message || 'Hubo un error al crear el usuario.';
        setError(errorMessage);
        Swal.fire({
            icon: 'error',
            title: 'Error al crear usuario',
            text: errorMessage,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de Conexión',
        text: 'Hubo un problema al conectar con el servidor.',
      });
    }
  };
  
  return (
    <FormContent>
      <Title>Crear Usuario</Title>
      <form onSubmit={handleSubmit}>
        <Label>Nombre Completo:</Label>
        <Input type="text" name="Nombre" value={userData.Nombre} onChange={handleChange} />
        
        <Label>Usuario:</Label>
        <Input type="text" name="Usuario" value={userData.Usuario} onChange={handleChange} />
        
        <Label>Contraseña:</Label>
        <Input type="password" name="Password" value={userData.Password} onChange={handleChange} />
        
        <Label>Identificación:</Label>
        <Input type="text" name="identificacion" value={userData.identificacion} onChange={handleChange} />
        
        <Label>Correo:</Label>
        <Input type="email" name="Correo" value={userData.Correo} onChange={handleChange} />

        <Label>Rol:</Label>
        <Select name="Rol" value={userData.Rol} onChange={handleChange}>
          <option value="Admin">Admin</option>
          <option value="General">General</option>
        </Select>

        {error && <ErrorMsg>{error}</ErrorMsg>}
        <Button type="submit" disabled={!userData.Usuario || !userData.Password || !userData.identificacion}>
          Crear Usuario
        </Button>
      </form>
    </FormContent>
  );
};

CreateUserForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
};

export default CreateUserForm;