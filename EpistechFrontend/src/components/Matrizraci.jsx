import { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { MultiSelect } from 'primereact/multiselect';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import Sidebar from './Sidebard';

import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const Container = styled.div`
  padding: 20px;
  background-color: #f8f9fa;
`;

const TitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const AddButton = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const Title = styled.h1`
  font-size: 24px;
  color: #333;
`;

// Ya no se necesita ActionButton, se puede usar Button directamente
const levels = [
  { label: 'Nivel 1', value: 'Nivel 1' },
  { label: 'Nivel 2', value: 'Nivel 2' },
  { label: 'Nivel 3', value: 'Nivel 3' }
];

const communicationTypes = [
  { label: 'Teléfono', value: 'Teléfono' },
  { label: 'Correo', value: 'Correo' },
  { label: 'SMS', value: 'SMS' }
];

const Matrizraci = () => {
  const toast = useRef(null);
  const [data, setData] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [visible, setVisible] = useState(false);
  const [newRecord, setNewRecord] = useState({
    Nombre: null,
    Nivel: [],
    FechaInicioDisponibilidad: null,
    FechaFinDisponibilidad: null,
    TipoComunicacion: [],
    Contacto: '', 
    Disponible: false
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  const fetchData = async () => {
    try {
      const response = await axios.get('http://52.190.10.138:4000/api/disponibles', getAuthHeaders());
      const formatted = response.data.map(item => ({
        ...item,
        FechaInicioDisponibilidad: item.FechaInicioDisponibilidad ? new Date(item.FechaInicioDisponibilidad) : null,
        FechaFinDisponibilidad: item.FechaFinDisponibilidad ? new Date(item.FechaFinDisponibilidad) : null,
      }));
      setData(formatted);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos.' });
    }
  };

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get('http://52.190.10.138:4000/api/usuarios/disponibles', getAuthHeaders());
      const userOptions = response.data.map(user => ({ label: user.Nombre, value: user.Nombre }));
      setUsuarios(userOptions);
    } catch (error) {
      console.error("Error fetching usuarios:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUsuarios();
  }, []);

  const deleteRow = (id) => {
    confirmDialog({
      message: '¿Está seguro de eliminar este registro?',
      header: 'Confirmación',
      icon: 'pi pi-info-circle',
      accept: async () => {
        try {
          await axios.delete(`http://52.190.10.138:4000/api/disponibles/${id}`, getAuthHeaders());
          fetchData();
          toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Registro eliminado.' });
        } catch (err) {
          const msg = err.response?.data?.message || 'Error al eliminar.';
          toast.current.show({ severity: 'error', summary: 'Error', detail: msg });
        }
      }
    });
  };

  const createRecord = async () => {
    try {
      await axios.post('http://52.190.10.138:4000/api/disponibles', newRecord, getAuthHeaders());
      setVisible(false);
      setNewRecord({ // Limpiar el formulario
        Nombre: null, Nivel: [], FechaInicioDisponibilidad: null, FechaFinDisponibilidad: null, TipoComunicacion: [], Contacto: '', Disponible: false
      });
      fetchData();
      toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Registro creado.' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al crear el registro.';
      toast.current.show({ severity: 'error', summary: 'Error', detail: msg });
    }
  };
  
  // --- CAMBIO CLAVE: Plantilla de acciones simplificada ---
  const actionBodyTemplate = (rowData) => (
    <Button 
        label="Eliminar" 
        icon="pi pi-trash" 
        onClick={() => deleteRow(rowData.Id)} 
        className="p-button-danger" 
    />
  );

  const availableBodyTemplate = (rowData) => (
    <span style={{ color: rowData.Disponible ? 'green' : 'red', fontWeight: 'bold' }}>
        {rowData.Disponible ? 'Sí' : 'No'}
    </span>
  );

  return (
    <>
      <Sidebar />
      <div style={{ marginLeft: 250 }}>
        <Container>
          <TitleContainer>
            <Title>Matriz RACI de disponibilidad</Title>
            <AddButton onClick={() => setVisible(true)}>+ Agregar Registro</AddButton>
          </TitleContainer>

          <Dialog header="Nuevo Registro" visible={visible} onHide={() => setVisible(false)} style={{ width: '50vw' }}>
            <div className="p-fluid">
              <div className="p-field" style={{marginBottom: '1rem'}}>
                <label>Nombre</label>
                <Dropdown value={newRecord.Nombre} options={usuarios} onChange={e => setNewRecord({ ...newRecord, Nombre: e.value })} placeholder="Seleccione un usuario" />
              </div>
              <div className="p-field" style={{marginBottom: '1rem'}}>
                <label>Nivel</label>
                <MultiSelect value={newRecord.Nivel} options={levels} onChange={e => setNewRecord({ ...newRecord, Nivel: e.value })} />
              </div>
              <div className="p-field" style={{marginBottom: '1rem'}}>
                <label>Fecha Inicio</label>
                <Calendar value={newRecord.FechaInicioDisponibilidad} onChange={e => setNewRecord({ ...newRecord, FechaInicioDisponibilidad: e.value })} showTime />
              </div>
              <div className="p-field" style={{marginBottom: '1rem'}}>
                <label>Fecha Fin</label>
                <Calendar value={newRecord.FechaFinDisponibilidad} onChange={e => setNewRecord({ ...newRecord, FechaFinDisponibilidad: e.value })} showTime />
              </div>
              <div className="p-field" style={{marginBottom: '1rem'}}>
                <label>Tipo de Comunicación</label>
                <MultiSelect value={newRecord.TipoComunicacion} options={communicationTypes} onChange={e => setNewRecord({ ...newRecord, TipoComunicacion: e.value })} />
              </div>
              <div className="p-field" style={{marginBottom: '1rem'}}>
                <label htmlFor="contacto">Contacto (Teléfono o Correo)</label>
                <InputText id="contacto" value={newRecord.Contacto} onChange={(e) => setNewRecord({ ...newRecord, Contacto: e.target.value })} />
              </div>
              <div className="p-field-checkbox" style={{marginBottom: '1rem'}}>
                <Checkbox inputId="disponible" checked={newRecord.Disponible} onChange={e => setNewRecord({ ...newRecord, Disponible: e.checked })} />
                <label htmlFor="disponible" style={{marginLeft: '0.5rem'}}>Disponible</label>
              </div>
              <Button label="Guardar" icon="pi pi-check" onClick={createRecord} />
            </div>
          </Dialog>

          <Toast ref={toast} />
          <ConfirmDialog />

          <DataTable value={data} tableStyle={{ minWidth: '60rem' }} emptyMessage="No se encontraron registros.">
            <Column field="Nombre" header="Nombre" />
            <Column field="Nivel" header="Nivel" body={(rowData) => Array.isArray(rowData.Nivel) ? rowData.Nivel.join(', ') : rowData.Nivel} />
            <Column field="FechaInicioDisponibilidad" header="Inicio" body={(rowData) => rowData.FechaInicioDisponibilidad?.toLocaleString('es-CO')} />
            <Column field="FechaFinDisponibilidad" header="Fin" body={(rowData) => rowData.FechaFinDisponibilidad?.toLocaleString('es-CO')} />
            <Column field="TipoComunicacion" header="Comunicación" body={(rowData) => Array.isArray(rowData.TipoComunicacion) ? rowData.TipoComunicacion.join(', ') : rowData.TipoComunicacion} />
            <Column field="Contacto" header="Contacto" />
            <Column field="Disponible" header="Disponible" body={availableBodyTemplate} />
            <Column header="Acciones" body={actionBodyTemplate} />
          </DataTable>
        </Container>
      </div>
    </>
  );
};

export default Matrizraci;