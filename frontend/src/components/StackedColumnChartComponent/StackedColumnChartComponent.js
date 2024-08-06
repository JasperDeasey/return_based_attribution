import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { IconButton } from '@mui/material';
import { SaveAlt as SaveAltIcon, Image as ImageIcon } from '@mui/icons-material';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, Title, Tooltip, Legend);

const StackedColumnChartComponent = ({ chartData }) => {
  const chartRef = React.useRef(null);

  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#36A2EB', '#FF6384'
  ];

  const brightColor = '#FF0000';
  const residualColor = {
    borderColor: brightColor,
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    borderDash: [5, 5],
    borderWidth: 1.5
  };

  const options = {
    plugins: {
      title: {
        display: !!chartData.title,
        text: chartData.title || 'Stacked Column Chart',
        position: 'top',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toFixed(2)}%`;
          }
        }
      },
      legend: {
        display: true,
        position: 'top'
      }
    },
    responsive: true,
    scales: {
      x: {
        stacked: true
      },
      y: {
        stacked: true,
        ticks: {
          callback: function(value) {
            return value.toFixed(2) + '%';
          }
        }
      }
    }
  };

  const data = {
    labels: chartData.labels,
    datasets: chartData.datasets.map((dataset, index) => {
      if (dataset.label === 'Residuals') {
        return {
          ...dataset,
          data: dataset.data.map(value => value * 100),
          borderColor: residualColor.borderColor,
          backgroundColor: residualColor.backgroundColor,
          borderDash: residualColor.borderDash,
          borderWidth: residualColor.borderWidth
        };
      } else if (dataset.label === 'Total Return') {
        return {
          ...dataset,
          borderColor: '#000000',
          borderWidth: 2,
          fill: false,
          type: 'line'
        };
      } else {
        return {
          ...dataset,
          data: dataset.data.map(value => value * 100),
          backgroundColor: colors[index % colors.length],
          borderColor: dataset.borderColor,
          borderDash: dataset.borderDash || [],
          borderWidth: 1
        };
      }
    })
  };

  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date," + chartData.datasets.map(dataset => dataset.label).join(",") + "\n";

    chartData.labels.forEach((label, index) => {
      const row = [label, ...chartData.datasets.map(dataset => dataset.data[index])].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "chart_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadImage = async () => {
    const canvas = await html2canvas(chartRef.current);
    canvas.toBlob(blob => {
      saveAs(blob, "chart_image.png");
    });
  };

  return (
    <div style={{ position: "relative" }}>
      <div ref={chartRef}>
        <Bar data={data} options={options} />
      </div>
      <div style={{ marginTop: "10px", display: "flex", justifyContent: "center" }}>
        <IconButton color="primary" onClick={downloadCSV}>
          <SaveAltIcon />
        </IconButton>

        <IconButton color="primary" onClick={downloadImage}>
          <ImageIcon />
        </IconButton>
      </div>
    </div>
  );
};

export default StackedColumnChartComponent;