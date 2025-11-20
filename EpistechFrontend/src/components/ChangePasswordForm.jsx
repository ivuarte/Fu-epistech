import { useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import axios from 'axios';
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

const CahngePassword = ({ onSuccess }) => {
  const [userData, setUserData] = useState({ user: '', password: '', rol: 'General', identificacion: '' });
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Validar que el valor solo contenga números
    if (name === 'identificacion' && !/^\d+$/.test(value)) {
      setError('La identificación solo puede contener números.');
      return;
    }
    setUserData((prevUserData) => ({
      ...prevUserData,
      [name]: value,
    }));
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios('/cambiarContrasena/:id', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: userData.user,
          newPassword: newPassword,
        }),
      });

      if (response.ok) {
        setUserData({ user: '', password: '', rol: 'General', identificacion: '' });
        setNewPassword('');
        onSuccess();
        Swal.fire({
          icon: 'success',
          title: 'Contraseña cambiada',
          text: 'La contraseña se ha cambiado correctamente.',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al cambiar contraseña',
          text: 'Hubo un error al cambiar la contraseña. Por favor, inténtelo de nuevo.',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al cambiar contraseña',
        text: 'Hubo un error al cambiar la contraseña. Por favor, inténtelo de nuevo.',
      });
    }
  };

  return (
    <FormContent>
      <Title>Cambiar Contraseña</Title>
      <form onSubmit={handleSubmit}>
        <Label>
          Usuario:
          <Input
            type="text"
            name="user"
            value={userData.user}
            onChange={handleChange}
          />
        </Label>
        <Label>
          Nueva Contraseña:
          <Input
            type="password"
            name="newPassword"
            value={newPassword}
            onChange={handleNewPasswordChange}
          />
        </Label>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <Button type="submit" disabled={!userData.user || !newPassword}>
          Cambiar Contraseña
        </Button>
      </form>
    </FormContent>
  );
};

CahngePassword.propTypes = {
  onSuccess: PropTypes.func.isRequired,
};

export default CahngePassword;
