import React, { useState, useEffect } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, TextField, Button, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
import './ReturnStreamAccordion.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const fetchAdjustedClosePrices = async (ticker, apiKey) => {
  try {
    const response = await axios.get(`https://api.twelvedata.com/time_series?symbol=${ticker}&interval=1month&outputsize=60&apikey=${apiKey}`);
    console.log('API Response:', response.data); // Debugging statement
    if (response.data && response.data.values) {
      return response.data.values.map(point => ({ date: point.datetime, adjustedClose: parseFloat(point.adjusted_close) }));
    } else {
      console.error('Unexpected API response structure:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching adjusted close prices:', error);
    return [];
  }
};

const calculateMonthlyReturns = (data) => {
  let returns = [];
  for (let i = 1; i < data.length; i++) {
    const monthlyReturn = (data[i].adjustedClose - data[i - 1].adjustedClose) / data[i - 1].adjustedClose;
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

const ReturnStreamAccordion = ({ returnStream, apiKey, index, handleStreamChange, handleRemoveStream }) => {
  const [data1, setData1] = useState([]);
  const [data2, setData2] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [labels, setLabels] = useState([]);
  const [isGraphGenerated, setIsGraphGenerated] = useState(false);

  const fetchDataForChart = async () => {
    const data1 = await fetchAdjustedClosePrices(returnStream.returnStream1, apiKey);
    const sortedData1 = data1.sort((a, b) => new Date(a.date) - new Date(b.date));
    const returns1 = calculateMonthlyReturns(sortedData1);

    let data2 = [];
    if (returnStream.returnStream2) {
      data2 = await fetchAdjustedClosePrices(returnStream.returnStream2, apiKey);
      const sortedData2 = data2.sort((a, b) => new Date(a.date) - new Date(b.date));
      const [alignedData1, alignedData2] = alignDataByDate(sortedData1, sortedData2);

      if (alignedData1.length === alignedData2.length) {
        const returns2 = calculateMonthlyReturns(alignedData2);
        const combinedReturns = returns1.map((ret, idx) => ret - returns2[idx]);
        setLabels(alignedData1.map(point => point.date));
        setCombinedData(convertToCumulativeReturns(combinedReturns));
        setData2(convertToCumulativeReturns(returns2));
      } else {
        console.error('Aligned data lengths do not match');
      }
    } else {
      setLabels(sortedData1.map(point => point.date));
      setCombinedData(convertToCumulativeReturns(returns1));
    }

    setData1(convertToCumulativeReturns(returns1));
    setIsGraphGenerated(true);
  };

  const generateChartData = () => {
    const datasets = [
      {
        label: returnStream.name1,
        data: data1,
        borderColor: getColor(index * 3),
        borderWidth: 1,
      },
      {
        label: returnStream.name2,
        data: data2,
        borderColor: getColor(index * 3 + 1),
        borderWidth: 1,
      },
      {
        label: `${returnStream.name1} - ${returnStream.name2}`,
        data: combinedData,
        borderColor: getColor(index * 3 + 2),
        borderWidth: 1,
      }
    ];
    return { labels, datasets };
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{returnStream.returnStream1} {returnStream.returnStream2 ? `- ${returnStream.returnStream2}` : ''} ({returnStream.description})</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <div className="return-stream-inputs">
          <TextField
            label="Return Stream 1"
            value={returnStream.returnStream1}
            onChange={(e) => handleStreamChange(index, 'returnStream1', e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Return Stream 2"
            value={returnStream.returnStream2}
            onChange={(e) => handleStreamChange(index, 'returnStream2', e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            value={returnStream.description}
            onChange={(e) => handleStreamChange(index, 'description', e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button variant="contained" color="primary" onClick={fetchDataForChart}>
            Generate Graph
          </Button>
          <Button variant="contained" color="secondary" onClick={() => handleRemoveStream(index)}>
            Remove
          </Button>
        </div>
        {isGraphGenerated && (
          <div className="chart-container">
            <Line data={generateChartData()} />
          </div>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default ReturnStreamAccordion;