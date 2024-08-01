import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LineChartComponent from './LineChartComponent';
import { TextField, Button, Typography, Box, Container, Paper } from '@mui/material';
import ReturnStreamPaste from './ReturnStreamPaste';
import './UploadInvestmentReturns.css';

const UploadInvestmentReturns = () => {
  const [data, setData] = useState('');
  const [fundName, setFundName] = useState('');
  const [chartData, setChartData] = useState(null);
  const exampleData = 'YYYY-MM-DD\t0.0123\nYYYY-MM-DD\t0.0456';
  const navigate = useNavigate();

  useEffect(() => {
    if (data) {
      parseData(data);
    }
  }, [data]);

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
          borderColor: undefined, // Optional color handling by LineChartComponent
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
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ padding: 3, marginTop: 3 }}>
        <Typography variant="h4" gutterBottom>
          Upload Investment Returns
        </Typography>
        <Typography variant="body1" gutterBottom>
          Paste your returns below. Returns must be in USD.
        </Typography>
        <Box component="form" noValidate autoComplete="off">
          <TextField
            label="Fund Name"
            variant="outlined"
            fullWidth
            margin="normal"
            value={fundName}
            onChange={(e) => setFundName(e.target.value)}
          />
          <ReturnStreamPaste data={data} setData={setData} exampleData={exampleData} />
        </Box>
        {chartData && (
          <Box sx={{ marginTop: 3 }}>
            <LineChartComponent chartData={chartData} />
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
          <Button variant="contained" color="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleUpload}>
            Upload
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default UploadInvestmentReturns;
