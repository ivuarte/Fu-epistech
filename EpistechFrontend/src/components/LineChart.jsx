import { useEffect, useState } from 'react';
import { Chart } from 'primereact/chart';
import axios from 'axios';

const LineChart = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // --- CAMBIO CLAVE: Obtener el token ---
        const token = localStorage.getItem('token');
        const fecha = new Date().toISOString().split('T')[0];
        
        // --- CAMBIO CLAVE: Añadir el header a la petición ---
        const response = await axios.get(`http://52.190.10.138:4000/api/eventos/conteo-por-hora?fecha=${fecha}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const formattedData = formatData(response.data);
        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };
    fetchData();
  }, []);

  const formatData = (data) => {
    const datasets = {
      Zabbix: {
        label: 'Zabbix',
        data: Array(24).fill(0),
        borderColor: '#F15B79',
        fill: false,
        tension: 0.1,
      },
      SolarWinds: {
        label: 'SolarWinds',
        data: Array(24).fill(0),
        borderColor: '#58A4F3',
        fill: false,
        tension: 0.1,
      },
    };

    // Asegurarse de que 'data' es un array antes de usar forEach
    if (Array.isArray(data)) {
        data.forEach(item => {
            const hora = item.hora;
            const fuente = item.fuente;
            const total = item.total_eventos;

            if (datasets[fuente]) { // Comprobar si la fuente existe en datasets
                datasets[fuente].data[hora] = total;
            }
        });
    }

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: Object.values(datasets),
    };
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      {chartData ? (
        <Chart type="line" data={chartData} options={options} style={{ marginBottom: '10px' }} />
      ) : (
        <div>Cargando gráfico...</div>
      )}
    </div>
  );
};

export default LineChart;