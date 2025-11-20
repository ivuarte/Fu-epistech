import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import styled from 'styled-components';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button as PrimeButton } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import CreateUserForm from './CreateUserForm';
import ChangePasswordForm from './ChangePasswordForm'; // Corregido el nombre del import
import Sidebar from './Sidebard'; // Corregido a minúscula

import 'primereact/resources/themes/saga-blue/theme.css'; 
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

// ... (Todos tus Styled Components se quedan igual)

const Container = styled.div`
  padding: 20px;
  background-color: #f8f9fa;
`;

const Title = styled.h1`
  font-size: 24px;
  color: #333;
`;

const AddButton = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const StatCard = styled.div`
  flex: 1;
  margin: 0 10px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  padding: 20px;
  text-align: center;
`;

const ActiveUsersCard = styled(StatCard)`
  background: #5cb85c;
  color: #fff;
  font-size: 14px;
  padding: 8px;
  text-align: center;
  margin: 0 10px 20px 0;
`;

const InactiveUsersCard = styled(StatCard)`
  background: #d9534f;
  color: #fff;
  font-size: 14px;
  padding: 5px;
  text-align: center;
  margin: 0 0 20px 10px;
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;
const EmployeesContainer = styled.div`
  margin-bottom: 20px;
`;

const TitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Divider = styled.hr`
  margin: 40px 0;
`;


const Setting = ({ onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://52.190.10.138:4000/api/usuarios/todos', {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // --- SOLUCIÓN: Definir handleSuccess aquí ---
  const handleSuccess = () => {
    fetchUsuarios(); // Refresca la lista de usuarios
    if (typeof onSuccess === 'function') {
      onSuccess();
    }
  };

  const changeUserStatus = async (id, newState) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://52.190.10.138:4000/api/usuarios/cambiarEstado/${id}`, 
        { estado: newState },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      handleSuccess(); // Llama a la función definida
    } catch (error) {
      console.error('Error changing user status:', error);
    }
  };
  
  const openChangePasswordDialog = (user) => {
    setCurrentUser(user);
    setShowChangePassword(true);
  };

  const statusBodyTemplate = (rowData) => {
    const isActive = rowData.Estado === 'Activo';
    return (
      <>
        <PrimeButton
          label={isActive ? 'Inhabilitar' : 'Activar'}
          className={`p-button-sm ${isActive ? 'p-button-danger' : 'p-button-success'}`}
          onClick={() => changeUserStatus(rowData.Id, isActive ? 'Inactivo' : 'Activo')}
        />
        <span style={{ marginLeft: '8px' }}></span>
        <PrimeButton
          label="Cambiar Contraseña"
          className="p-button-sm p-button-info"
          onClick={() => openChangePasswordDialog(rowData)}
        />
      </>
    );
  };

  const lastConnectionTemplate = (rowData) => {
    const lastConnection = rowData.UltimaConexion ? new Date(rowData.UltimaConexion) : null;
    return lastConnection ? lastConnection.toLocaleString('es-CO') : 'Nunca';
  };

  const header = (
    <div className="table-header">Lista de Usuarios</div>
  );

  return (
    <>
      <Sidebar/>
      <div style={{marginLeft: 250}}>
        <Container>
          <TitleContainer>
            <Title>Usuarios</Title>
            <AddButton onClick={() => setShowCreateUser(true)}>+ Crear Usuario</AddButton>
          </TitleContainer>

          <StatsContainer>
            <ActiveUsersCard>
              <h3>Usuarios Activos</h3>
              <p>{employees.filter(e => e.Estado === 'Activo').length}</p>
            </ActiveUsersCard>
            <InactiveUsersCard>
              <h3>Usuarios Inactivos</h3>
              <p>{employees.filter(e => e.Estado === 'Inactivo').length}</p>
            </InactiveUsersCard>
          </StatsContainer>

          <Divider />

          <EmployeesContainer>
            <DataTable value={employees} header={header} tableStyle={{ minWidth: '60rem' }}>
              <Column field="Usuario" header="Nombre"></Column>
              <Column field="Rol" header="Rol"></Column>
              <Column field="Estado" header="Estado"></Column>
              <Column field="UltimaConexion" header="Última Conexión" body={lastConnectionTemplate}></Column>
              <Column header="Acciones" body={statusBodyTemplate}></Column>
            </DataTable>
          </EmployeesContainer>

          {/* --- DIÁLOGOS --- */}
          <Dialog header="Crear Nuevo Usuario" visible={showCreateUser} onHide={() => setShowCreateUser(false)} style={{ width: '50vw' }}>
            <CreateUserForm onSuccess={() => { handleSuccess(); setShowCreateUser(false); }} />
          </Dialog>

          {currentUser && (
            <Dialog 
              header={`Cambiar Contraseña de ${currentUser.Usuario}`} 
              visible={showChangePassword} 
              onHide={() => setShowChangePassword(false)} 
              style={{ width: '50vw' }}
            >
              <ChangePasswordForm 
                userId={currentUser.Id} 
                onSuccess={() => { 
                  handleSuccess(); 
                  setShowChangePassword(false); 
                }} 
              />
            </Dialog>
          )}

        </Container>
      </div>
    </>
  );
};

Setting.propTypes = {
  onSuccess: PropTypes.func,
};

export default Setting;