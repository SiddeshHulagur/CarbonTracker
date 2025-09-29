import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const EmissionsChart = ({ data }) => {
  // Normalize values and compute a dynamic Y max with headroom so the line stays in-bounds
  const values = Array.isArray(data) ? data.map(d => Number(d.co2) || 0) : [];
  const maxVal = values.length ? Math.max(...values) : 0;
  const yMax = maxVal === 0 ? 1 : Number((maxVal * 1.2).toFixed(2)); // +20% headroom, at least 1

  const chartData = {
    labels: data.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'CO2 Emissions (kg)',
        data: values,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Respect the container height
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: yMax,
        title: {
          display: true,
          text: 'CO2 (kg)'
        },
        ticks: {
          // Keep tick labels tidy for small values
          callback: (val) => Number(val).toFixed(1),
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
        },
      }
    },
  };

  return (
    <div className="h-64 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default EmissionsChart;
