import { Link } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Panel } from 'primereact/panel';
import LineChart from './LineChart'; 
import { Divider } from 'primereact/divider';
import Sidebar from './Sidebard'; // Corregido a minúscula para coincidir con el nombre del archivo

const Container = styled.div`
  padding: 20px;
  box-sizing: border-box;
  display: flex;
`;

const ChartContainer = styled.div`
  flex: 1;
  padding-right: 20px;
`;

const ProblemsContainer = styled.div`
  flex: 1;
  padding-left: 20px;
  overflow-y: auto;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
`;

const Title = styled.h2`
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  margin-right: 10px;
`;

const Button = styled(Link)`
  padding: 10px 20px;
  font-size: 16px;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  text-decoration: none;
`;

const ProblemItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const ProblemName = styled.span`
  flex: 1;
`;

const ProblemCount = styled.span`
  margin-left: 10px;
`;

const ProgressBarContainer = styled.div`
  display: flex;
  width: 100%;
  height: 25px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
`;

const ProgressBarSegment = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  font-weight: bold;
`;

const colorMapping = {
  Zabbix: '#F15B79',
  SolarWinds: '#58A4F3',
  Default: '#8D6E63'
};

const Problems = () => {
  const [problemsData, setProblemsData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://52.190.10.138:4000/api/eventos/no-gestionados', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = response.data;

        // Agrupar por sensor
        const eventCounts = data.reduce((acc, event) => {
          const sensor = event.Sensor || event.sensor || 'Sensor desconocido';
          const fuente = event.Fuente || event.fuente || 'Desconocido';

          if (!acc[sensor]) {
            acc[sensor] = { total: 0, sources: {} };
          }

          acc[sensor].total += 1;
          acc[sensor].sources[fuente] = (acc[sensor].sources[fuente] || 0) + 1;

          return acc;
        }, {});

        // Formatear los datos para el componente
        const formattedData = Object.entries(eventCounts).map(([sensor, value], index) => ({
          id: index,
          name: sensor,
          total: value.total,
          sources: value.sources
        }));
        
        // La corrección clave: Mover esta línea aquí
        setProblemsData(formattedData);

      } catch (error) {
        console.error('Error al obtener los eventos:', error);
      }
    };

    fetchData();
  }, []);


  return (
    <>
      <Sidebar />
      <div style={{ marginLeft: 250 }}>
        <Container>
          <ChartContainer>
            <h1>Actividad de Eventos</h1>
            <i>Eventos ocurridos en el transcurso del día</i>
            <Divider />
            <LineChart style={{ width: '100%', height: '100%' }} />
          </ChartContainer>
          <ProblemsContainer>
            <TitleContainer>
              <Title>Monitoreo de Eventos por Sensor</Title>
              <Button to="/management">Gestionar</Button>
            </TitleContainer>
            <i>Eventos por gestionar agrupados por sensor</i>
            {problemsData.map((problem) => (
              <Panel key={problem.id} header={problem.name} style={{ marginBottom: '10px' }}>
                <ProblemItem>
                  <ProblemName>Total:</ProblemName>
                  <ProblemCount>{problem.total}</ProblemCount>
                </ProblemItem>
                <ProgressBarContainer>
                  {Object.entries(problem.sources).map(([source, count]) => (
                    <ProgressBarSegment
                      key={source}
                      style={{
                        width: `${(count / problem.total) * 100}%`,
                        backgroundColor: colorMapping[source] || colorMapping.Default
                      }}
                    >
                      {source}: {count}
                    </ProgressBarSegment>
                  ))}
                </ProgressBarContainer>
              </Panel>
            ))}
          </ProblemsContainer>
        </Container>
      </div>
    </>
  );
};

export default Problems;