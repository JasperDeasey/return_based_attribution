import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
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
import './ReturnStreamBox.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const fetchData = async (ticker, apiKey) => {
  try {
    const response = await axios.get(`https://api.twelvedata.com/time_series?symbol=${ticker}&interval=1month&outputsize=60&currency=USD&apikey=${apiKey}`);
    if (response.data && response.data.values) {
      return response.data.values.map(point => ({ date: point.datetime, close: parseFloat(point.close) }));
    } else {
      console.error('Unexpected API response structure:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
};

const calculateMonthlyReturns = (data) => {
  let returns = [];
  for (let i = 1; i < data.length; i++) {
    const monthlyReturn = (data[i].close - data[i - 1].close) / data[i - 1].close;
    returns.push(monthlyReturn);
  }
  return returns;
};

const convertToCumulativeReturns = (returns) => {
  let cumulativeReturns = [1];
  for (let i = 0; i < returns.length; i++) {
    cumulativeReturns.push(cumulativeReturns[i] * (1 + returns[i]));
  }
  return cumulativeReturns;
};

const alignDataByDate = (data1, data2) => {
  const dates1 = data1.map(d => d.date);
  const dates2 = new Set(data2.map(d => d.date));
  const alignedData1 = data1.filter(d => dates2.has(d.date));
  const alignedData2 = data2.filter(d => dates1.includes(d.date));
  return [alignedData1, alignedData2];
};

const getColor = (index) => {
  const colors = [
    'red', 'green', 'blue', 'orange', 'purple', 'brown', 'pink', 'gray', 'cyan', 'magenta'
  ];
  return colors[index % colors.length];
};

const ReturnStreamBox = ({ returnStream, apiKey, index, handleStreamChange, handleRemoveStream }) => {
  const [data, setData] = useState([]);
  const [labels, setLabels] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const fetchDataForChart = async () => {
      const data1 = await fetchData(returnStream.returnStream1, apiKey);
      const sortedData1 = data1.sort((a, b) => new Date(a.date) - new Date(b.date));
      const returns1 = calculateMonthlyReturns(sortedData1);

      if (returnStream.returnStream2) {
        const data2 = await fetchData(returnStream.returnStream2, apiKey);
        const sortedData2 = data2.sort((a, b) => new Date(a.date) - new Date(b.date));
        const [alignedData1, alignedData2] = alignDataByDate(sortedData1, sortedData2);

        if (alignedData1.length === alignedData2.length) {
          const returns2 = calculateMonthlyReturns(alignedData2);
          const combinedReturns = returns1.map((ret, idx) => ret - returns2[idx]);
          setLabels(alignedData1.map(point => point.date));
          setData(convertToCumulativeReturns(combinedReturns));
        } else {
          console.error('Aligned data lengths do not match');
        }
      } else {
        setLabels(sortedData1.map(point => point.date));
        setData(convertToCumulativeReturns(returns1));
      }
    };

    fetchDataForChart();
  }, [returnStream, apiKey]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const generateChartData = () => {
    const datasets = [
      {
        label: returnStream.description,
        data: data,
        borderColor: getColor(index),
        borderWidth: 1,
      }
    ];
    return { labels, datasets };
  };

  return (
    <div className="return-stream-box">
      <div className="return-stream-summary">
        <span>{returnStream.returnStream1}</span>
        <span>{returnStream.returnStream2 ? ` - ${returnStream.returnStream2}` : ''}</span>
        <span>{returnStream.description}</span>
        <button className="collapse-button" onClick={toggleCollapse}>
          {isCollapsed ? 'V' : '^'}
        </button>
      </div>
      {!isCollapsed && (
        <div className="expanded-content">
          <div className="chart-container">
            <Line data={generateChartData()} />
          </div>
          <div className="return-stream-inputs">
            <input
              type="text"
              placeholder="Return Stream 1"
              value={returnStream.returnStream1}
              onChange={(e) => handleStreamChange(index, 'returnStream1', e.target.value)}
            />
            <input
              type="text"
              placeholder="Return Stream 2"
              value={returnStream.returnStream2}
              onChange={(e) => handleStreamChange(index, 'returnStream2', e.target.value)}
            />
            <input
              type="text"
              placeholder="Description"
              value={returnStream.description}
              onChange={(e) => handleStreamChange(index, 'description', e.target.value)}
            />
            <button className="remove-button" onClick={() => handleRemoveStream(index)}>Remove</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnStreamBox;