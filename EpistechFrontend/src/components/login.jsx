import  { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from "styled-components";
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import logo from "../assets/Images/logo.png";
import Swal from 'sweetalert2';
import tokenAuth from './TokenAuth'; // Importa la función tokenAuth desde el archivo correcto
import 'primereact/resources/themes/saga-blue/theme.css'; // O cualquier otro tema de tu elección
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh; 
`;

const Content = styled.div`
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid #ccc;
  padding: 20px;
  box-sizing: border-box;
  text-align: center;
`;
const Logo = styled.img`
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover {
    transform: scale(1.1) rotateX(10deg) rotateY(10deg);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  }
`;

const Title = styled.h2`
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
`;

const TextInfo = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const SpanVerde = styled.span`
  color: #EC2BC6;
  font-weight: bold;
`;

const SpanAzul = styled.span`
  color: #4F70DF;
  font-weight: bold;
`;

const Login = () => {
  const [userData, setUserData] = useState({ user: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Usamos axios.post. El body se pasa como segundo argumento.
      const response = await axios.post('http://52.190.10.138:4000/api/auth/auth', userData);
  
      // Si la petición es exitosa, la respuesta está en response.data
      const data = response.data;
      
      // Guardar token y userId en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.Id); // El backend devuelve Id con mayúscula

      // Configurar axios para usar el token en todas las peticiones futuras
      tokenAuth(data.token);
  
      Swal.fire({
        icon: 'success',
        title: 'Bienvenido',
        text: `Bienvenido ${data.user}`,
      }).then(() => {
        navigate('/problems');
      });

    } catch (error) {
      // axios maneja los errores en el bloque catch
      const errorMessage = error.response?.data || 'Hubo un problema al iniciar sesión.';
      console.error('Error de login:', errorMessage);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
      });
    }
  };
  

  return (
    <Container>
      <Content>
        <Logo src={logo} alt="Logo" />
        <Title>
          Bienvenido a
          <SpanAzul> Epis</SpanAzul>
          <SpanVerde> Tech!</SpanVerde>
        </Title>
        <TextInfo>Ingresa los datos de tu cuenta</TextInfo>
        <Form onSubmit={handleSubmit}>
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">
              <i className="pi pi-user"></i>
            </span>
            <InputText 
              placeholder="Usuario" 
              value={userData.user} 
              onChange={(e) => handleChange({ target: { name: 'user', value: e.target.value } })} 
            />
          </div>
          <div className="p-inputgroup flex-1" style={{ marginTop: '10px' }}>
            <span className="p-inputgroup-addon">
              <i className="pi pi-lock"></i>
            </span>
            <InputText 
              type="password" 
              placeholder="Contraseña" 
              value={userData.password} 
              onChange={(e) => handleChange({ target: { name: 'password', value: e.target.value } })} 
            />
          </div>
          <Button 
            type="submit" 
            label="Ingresar" 
            icon="pi pi-check" 
            style={{ marginTop: '20px', width: '100%' }} 
          />
        </Form>
      </Content>
    </Container>
  );
};

export default Login;
