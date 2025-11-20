import { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import Sidebar from './Sidebard';
import Swal from 'sweetalert2';
import axios from 'axios';

const Management = () => {
  const [eventos, setEventos] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [visible, setVisible] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [formData, setFormData] = useState({
    comentario: '',
    responsable: '',
    clienteImpactado: '',
    sistemaImpactado: ''
  });

  const userId = localStorage.getItem('userId');

  const cargarEventos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://52.190.10.138:4000/api/Eventos/no-gestionados', { // "Eventos" con E mayúscula
          headers: { 'Authorization': `Bearer ${token}` }
      });
      setEventos(response.data);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      Swal.fire('Error', 'No se pudieron cargar los eventos.', 'error');
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  const handleRowClick = (e) => {
    setSelectedEvento(e.data);
    setFormData({
      comentario: '',
      responsable: '',
      clienteImpactado: '',
      sistemaImpactado: ''
    });
    setVisible(true);
  };

  const handleSubmit = async () => {
    if (!selectedEvento) return;

    const payload = {
      ...formData,
      IdUser: userId
    };

    try {
      const token = localStorage.getItem('token');
      // --- ESTE ES EL CAMBIO CLAVE ---
      // La URL ahora es correcta: /api/Eventos/gestionar/:eventid
      await axios.put(`http://52.190.10.138:4000/api/Eventos/gestionar/${selectedEvento.eventid}`, payload, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Evento gestionado',
        text: 'Se ha actualizado correctamente.',
        timer: 2000,
        showConfirmButton: false
      });
      setVisible(false);
      setSelectedEvento(null);
      cargarEventos();
    } catch (err) {
      const errorMsg = err.response?.data || 'No se pudo actualizar el evento.';
      console.error('Error en la solicitud:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMsg
      });
    }
  };

  const header = (
    <div style={{ textAlign: 'left' }}>
      <h1>Eventos Activos</h1>
      <div>
        <i className="pi pi-search" style={{ margin: '4px 4px 0 0' }} />
        <InputText
          type="search"
          onInput={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar"
          size="50"
        />
      </div>
    </div>
  );

  const fechaAlertaBodyTemplate = (rowData) => new Date(rowData.fecha_creacion * 1000).toLocaleString();
  const descripcionBodyTemplate = (rowData) => rowData.name;
  const fuenteBodyTemplate = (rowData) => (<span style={{ color: 'red' }}>{rowData.fuente}</span>);
  const severidadBodyTemplate = (rowData) => rowData.severity;
  const clasificacionBodyTemplate = (rowData) => 'Sin Clasificar';

  return (
    <div>
      <Sidebar/>
      <div style={{marginLeft: 250}}>
        <DataTable
          value={eventos}
          header={header}
          globalFilter={globalFilter}
          emptyMessage="No se encontraron eventos"
          scrollable
          scrollHeight="700px"
          selectionMode="single"
          onRowClick={handleRowClick}
        >
          <Column field="eventid" header="ID" sortable frozen />
          <Column field="fecha_creacion" header="Fecha de Alerta" body={fechaAlertaBodyTemplate} sortable />
          <Column field="name" header="Descripción" body={descripcionBodyTemplate} sortable />
          <Column field="fuente" header="Fuente" body={fuenteBodyTemplate} sortable />
          <Column field="severity" header="Severidad" body={severidadBodyTemplate} sortable />
          <Column header="Clasificación" body={clasificacionBodyTemplate} sortable />
        </DataTable>
      </div>
      
      <Dialog header="Gestionar Evento" visible={visible} style={{ width: '40vw' }} onHide={() => setVisible(false)}>
        <div className="p-fluid">
          <div className="p-field">
            <label>Comentario</label>
            <InputTextarea rows={3} value={formData.comentario} onChange={e => setFormData({ ...formData, comentario: e.target.value })} />
          </div>
          <div className="p-field">
            <label>Responsable</label>
            <InputText value={formData.responsable} onChange={e => setFormData({ ...formData, responsable: e.target.value })} />
          </div>
          <div className="p-field">
            <label>Cliente Impactado</label>
            <InputText value={formData.clienteImpactado} onChange={e => setFormData({ ...formData, clienteImpactado: e.target.value })} />
          </div>
          <div className="p-field">
            <label>Sistema Impactado</label>
            <InputText value={formData.sistemaImpactado} onChange={e => setFormData({ ...formData, sistemaImpactado: e.target.value })} />
          </div>
        </div>
        <div className="p-dialog-footer" style={{paddingTop: '1rem'}}>
          <Button label="Cancelar" icon="pi pi-times" onClick={() => setVisible(false)} className="p-button-text" />
          <Button label="Guardar" icon="pi pi-check" onClick={handleSubmit} autoFocus />
        </div>
      </Dialog>
    </div>
  );
};

export default Management;