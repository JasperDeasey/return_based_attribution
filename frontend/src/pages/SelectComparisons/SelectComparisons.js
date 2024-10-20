// SelectComparisons.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Grid,
  Container,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RegressionAccordion from '../../components/RegressionAccordion/RegressionAccordion';
import FundReturnInput from '../../components/FundReturnInput';
import BenchmarkInputs from '../../components/BenchmarkInputs';

const initialData = {
  fund: { description: 'Input Fund Name', pastedData: [] },
  benchmark: { description: 'ACWI', source: 'MSCI ACWI TR Net USD' },
  residual_return_streams: [
    { description: 'Equity', source: 'MSCI ACWI TR Net USD', residualization: [] },
    { description: 'Interest Rates', source: 'Bloomberg Global Aggregate - Sovereign USD', residualization: [] },
    { description: 'Credit', source: 'ICE BofA Global Corporate Index', residualization: ['Equity', 'Interest Rates'] },
    { description: 'Emerging Markets', source: 'MSCI EM TR Net USD', residualization: ['Equity', 'Interest Rates', 'Credit'] },
    { description: 'Momentum', source: 'MSCI ACWI Momentum TR Net USD', residualization: ['Equity', 'Interest Rates', 'Credit', 'Emerging Markets'] },
    { description: 'Quality', source: 'MSCI ACWI Quality TR Net USD', residualization: ['Equity', 'Interest Rates', 'Credit', 'Emerging Markets'] },
    { description: 'Small Cap', source: 'MSCI ACWI Small Cap TR Net USD', residualization: ['Equity', 'Interest Rates', 'Credit', 'Emerging Markets'] },
    { description: 'Value', source: 'MSCI ACWI Value TR Net USD', residualization: ['Equity', 'Interest Rates', 'Credit', 'Emerging Markets'] },
  ],
};

const base_url = 'https://return-attribution-c87301303521.herokuapp.com';
// const base_url = 'http://127.0.0.1:5000';

const SelectComparisons = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  useEffect(() => {
    const savedData = localStorage.getItem('comparisonData');
    if (savedData) {
      setData(JSON.parse(savedData));
    }
  }, []);

  // Save state to localStorage whenever it updates
  useEffect(() => {
    console.log('State updated:', data);
    localStorage.setItem('comparisonData', JSON.stringify(data));
  }, [data]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleSubmit = () => {
    if (data.fund.pastedData.length === 0) {
      setSnackbarSeverity('warning');
      setSnackbarMessage('Please paste fund returns above');
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    setSnackbarSeverity('info');
    setSnackbarMessage('This may take a few minutes...');
    setSnackbarOpen(true);

    const url = base_url + '/submit-data';

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((responseData) => {
        const taskId = responseData.task_id;
        checkTaskStatus(taskId);
      })
      .catch((error) => {
        console.error('Error:', error);
        setSnackbarSeverity('error');
        setSnackbarMessage(`Error: ${error.message}`);
        setSnackbarOpen(true);
        setLoading(false);
      });
  };

  const handleReset = () => {
    setData(initialData); // Reset the state to the initial data
    localStorage.removeItem('comparisonData'); // Clear saved data from localStorage
  };

  // Modify the checkTaskStatus function to handle new task states
  const checkTaskStatus = (taskId) => {
    const statusUrl = base_url + `/task-status/${taskId}`;

    const intervalId = setInterval(() => {
      fetch(statusUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then((statusData) => {
          if (statusData.status === 'completed') {
            console.log('Processed Data:', statusData.result);

            // Save the current state before navigating
            localStorage.setItem('submittedData', JSON.stringify(data));

            navigate('/analysis', { state: { data: statusData.result } });
            setLoading(false);
            clearInterval(intervalId);
          } else if (statusData.status === 'error') {
            setSnackbarSeverity('error');
            setSnackbarMessage(`Error: ${statusData.error}`);
            setSnackbarOpen(true);
            setLoading(false);
            clearInterval(intervalId);
          } else if (statusData.status === 'pending' || statusData.status === 'STARTED') {
            console.log('Processing...');
          } else {
            console.log(`Task status: ${statusData.status}`);
          }
        })
        .catch((error) => {
          console.error('Error:', error);
          setSnackbarSeverity('error');
          setSnackbarMessage(`Error: ${error.message}`);
          setSnackbarOpen(true);
          setLoading(false);
          clearInterval(intervalId);
        });
    }, 5000); // Check every 5 seconds
  };

  const handleFundDescriptionChange = (field, value) => {
    setData((prevData) => ({
      ...prevData,
      fund: { ...prevData.fund, [field]: value },
    }));
  };

  const handleBenchmarkChange = (field, value) => {
    setData((prevData) => ({
      ...prevData,
      benchmark: { ...prevData.benchmark, [field]: value },
    }));
  };

  const handleDataChange = (index, field, value) => {
    setData((prevData) => {
      const updatedResiduals = prevData.residual_return_streams.map((residual, i) => {
        if (i === index) {
          return { ...residual, [field]: value };
        }
        if (field === 'description') {
          return {
            ...residual,
            residualization: residual.residualization.map((residualizationItem) =>
              residualizationItem === prevData.residual_return_streams[index].description ? value : residualizationItem
            ),
          };
        }
        return residual;
      });
      return {
        ...prevData,
        residual_return_streams: updatedResiduals,
      };
    });
  };

  const handleRemoveRegression = (description) => {
    setData((prevData) => {
      const updatedResiduals = prevData.residual_return_streams
        .filter((residual) => residual.description !== description)
        .map((residual) => ({
          ...residual,
          residualization: residual.residualization.filter((residualizationItem) => residualizationItem !== description),
        }));
      return {
        ...prevData,
        residual_return_streams: updatedResiduals,
      };
    });
  };

  const handleAddResidual = () => {
    setData((prevData) => ({
      ...prevData,
      residual_return_streams: [
        ...prevData.residual_return_streams,
        { description: `New Residual ${prevData.residual_return_streams.length + 1}`, source: '', residualization: [] },
      ],
    }));
  };

  const handlePastedDataUpdate = (newData) => {
    console.log(newData);
    setData((prevData) => ({
      ...prevData,
      fund: {
        ...prevData.fund,
        pastedData: newData,
      },
    }));
  };

  const availableDescriptions = data.residual_return_streams.map((stream) => stream.description);

  return (
    <Container maxWidth="lg">
      <Box sx={{ padding: 2 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Return-Based Statistical Analysis
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Upload and select return streams below
        </Typography>
        <Grid container spacing={3}>
          {/* Fund Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Fund
              </Typography>
              <FundReturnInput
                fund={data.fund}
                onDescriptionChange={handleFundDescriptionChange}
                updateFundReturns={handlePastedDataUpdate}
                pastedData={data.fund.pastedData}
              />
            </Paper>
          </Grid>

          {/* Benchmark Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Benchmark
              </Typography>
              <BenchmarkInputs
                benchmarkData={data.benchmark}
                handleDescriptionChange={handleBenchmarkChange}
                handleStreamChange={handleBenchmarkChange}
              />
            </Paper>
          </Grid>

          {/* Regression Return Streams Section */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Regression Return Streams</Typography>
              </Box>
              {data.residual_return_streams.map((stream, index) => (
                <RegressionAccordion
                  key={index}
                  index={index}
                  returnStream={stream}
                  handleDataChange={handleDataChange}
                  onRemove={() => handleRemoveRegression(stream.description)}
                  availableDescriptions={availableDescriptions}
                />
              ))}
              {/* Add Residual Button at the Bottom */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <IconButton
                  color="primary"
                  onClick={handleAddResidual}
                  sx={{
                    backgroundColor: (theme) => theme.palette.primary.main,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.primary.dark,
                    },
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Paper>
          </Grid>
          
        </Grid>

        {/* Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
          <Button variant="outlined" color="error" onClick={handleReset}>
            Reset Page
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading} sx={{ minWidth: 120 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
          </Button>
        </Box>

        {/* Snackbar for Notifications */}
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default SelectComparisons;
