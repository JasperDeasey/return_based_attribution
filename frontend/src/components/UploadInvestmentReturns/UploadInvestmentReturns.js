import React, { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import './UploadInvestmentReturns.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const UploadInvestmentReturns = () => {
  const [data, setData] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [fundName, setFundName] = useState('');
  const [chartData, setChartData] = useState(null);
  const exampleData = 'YYYY-MM-DD\t0.0123\nYYYY-MM-DD\t0.0456';
  const navigate = useNavigate();

  useEffect(() => {
    if (data) {
      parseData(data);
    }
  }, [data]);

  const handlePaste = (event) => {
    const paste = event.clipboardData.getData('Text');
    setData(paste);
  };

  const parseData = (paste) => {
    const lines = paste.split('\n');
    const dates = [];
    const returns = [];
    let cumulativeReturn = 1;
    lines.forEach(line => {
      const [date, ret] = line.split('\t').map(s => s.trim());
      if (date && ret) {
        dates.push(date);
        cumulativeReturn *= (1 + parseFloat(ret));
        returns.push((cumulativeReturn - 1) * 100); // Convert to percentage
      }
    });

    setChartData({
      labels: dates,
      datasets: [
        {
          label: `${fundName} Cumulative Returns`,
          data: returns,
          fill: false,
          backgroundColor: 'blue',
          borderColor: 'blue',
        }
      ]
    });
  };

  const handleUpload = () => {
    navigate('/select-comparisons'); // Navigate to /select-comparisons page
  };

  const handleCancel = () => {
    window.location.reload(); // Reload the page
  };

  return (
    <div className="upload-container">
      <h2>Upload Investment Returns</h2>
      <p>Paste your returns below</p>
      <div className="form-group">
        <label htmlFor="fundName">Fund Name:</label>
        <input
          type="text"
          id="fundName"
          value={fundName}
          onChange={(e) => setFundName(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="currency">Currency:</label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="JPY">JPY</option>
          <option value="CHF">CHF</option>
          <option value="AUD">AUD</option>
          <option value="CAD">CAD</option>
        </select>
      </div>
      <div className="paste-section">
        <div className="textarea-container">
          <textarea
            className="paste-area"
            onPaste={handlePaste}
            value={data}
            onChange={(e) => setData(e.target.value)}
          ></textarea>
          {!data && <pre className="placeholder-text">{exampleData}</pre>}
        </div>
      </div>
      {chartData && (
        <div className="chart-container">
          <Line data={chartData} />
        </div>
      )}
      <div className="footer">
        <button className="cancel-button" onClick={handleCancel}>Cancel</button>
        <button className="upload-button" onClick={handleUpload}>Upload</button>
      </div>
    </div>
  );
};

export default UploadInvestmentReturns;