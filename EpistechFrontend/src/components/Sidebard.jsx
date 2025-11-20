import { Link } from 'react-router-dom';
import styled from 'styled-components';
import logo from '../assets/Images/logo.png';

const SidebarContainer = styled.div`
  height: 100%;
  width: 250px;
  position: fixed;
  top: 0;
  left: 0;
  background-color: #f8f9fa;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: width 0.3s;
  overflow: hidden;
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
`;

const LogoImage = styled.img`
  height: 80px;
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover {
    transform: scale(1.1) rotateX(10deg) rotateY(10deg);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  }
`;

const SidebarMenu = styled.div`
  padding-top: 10px;
`;

const SidebarLink = styled(Link)`
  display: block;
  color: #333;
  padding: 15px 20px;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
  &:hover {
    background-color: #e9ecef;
    color: #000;
  }
`;

const Sidebar = () => {
  return (
    <SidebarContainer>
      <LogoContainer>
        <LogoImage src={logo} alt="Logo" />
      </LogoContainer>
      <SidebarMenu>
      <SidebarLink to="/problems">Integrador de eventos</SidebarLink>
        <SidebarLink to="/setting">Configuracion usuarios</SidebarLink>
        <SidebarLink to="/matrizRaci">Matriz Raci Disponibilidad</SidebarLink>
        <SidebarLink to="/">Logout</SidebarLink>
      </SidebarMenu>
    </SidebarContainer>
  );
};

export default Sidebar;
