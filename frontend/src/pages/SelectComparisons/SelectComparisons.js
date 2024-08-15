import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Box, Button, IconButton, CircularProgress, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RegressionAccordion from '../../components/RegressionAccordion/RegressionAccordion';
import FundReturnInput from '../../components/FundReturnInput';
import BenchmarkInputs from '../../components/BenchmarkInputs';
import './SelectComparisons.css';

const initialData = {
  fund: { description: 'Input Fund Name', pastedData: [] },
  benchmark: { description: 'ACWI', source: 'MSCI ACWI TR Net USD' },
  residual_return_streams: [
    { description: 'Equity', source: 'MSCI ACWI TR Gross USD', residualization: [] },
    { description: 'Interest Rates', source: 'Bloomberg Global Aggregate - Sovereign USD', residualization: [] },
    { description: 'Credit', source: 'ICE BofA Global Corporate Index', residualization: ['Equity', 'Interest Rates'] },
    { description: 'Emerging Markets', source: 'MSCI EM TR Gross USD', residualization: ['Equity', 'Interest Rates', 'Credit'] },
    { description: 'Momentum', source: 'MSCI ACWI Momentum TR Gross USD', residualization: ['Equity', 'Interest Rates', 'Credit', 'Emerging Markets'] },
    { description: 'Quality', source: 'MSCI ACWI Quality TR Gross USD', residualization: ['Equity', 'Interest Rates', 'Credit', 'Emerging Markets'] },
    { description: 'Small Cap', source: 'MSCI ACWI Small Cap TR Gross USD', residualization: ['Equity', 'Interest Rates', 'Credit', 'Emerging Markets'] },
    { description: 'Value', source: 'MSCI ACWI Value TR Gross USD', residualization: ['Equity', 'Interest Rates', 'Credit', 'Emerging Markets'] }
  ]
};

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
    console.log("State updated:", data);
    localStorage.setItem('comparisonData', JSON.stringify(data));
  }, [data]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleSubmit = () => {
    if (data.fund.pastedData.length === 0) {
        setSnackbarSeverity('warning');
        setSnackbarMessage("Please paste fund returns above");
        setSnackbarOpen(true);
        return;
    }

    setLoading(true);
    setSnackbarSeverity('info');
    setSnackbarMessage("This may take a few minutes...");
    setSnackbarOpen(true);

    const url = 'https://return-attribution-c87301303521.herokuapp.com/submit-data';

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(responseData => {
        const taskId = responseData.task_id;
        checkTaskStatus(taskId);
    })
    .catch(error => {
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

  const checkTaskStatus = (taskId) => {
    const statusUrl = `https://return-attribution-c87301303521.herokuapp.com/task-status/${taskId}`;

    const intervalId = setInterval(() => {
        fetch(statusUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(statusData => {
            if (statusData.status === 'completed') {
                console.log('Processed Data:', statusData.result);
                
                // Save the current state before navigating
                localStorage.setItem('submittedData', JSON.stringify(data));
                
                navigate('/analysis', { state: { data: statusData.result } });
                setLoading(false);
                clearInterval(intervalId);
            } else if (statusData.status === 'error') {
                console.error('Error:', statusData.result.error);
                setSnackbarSeverity('error');
                setSnackbarMessage(`Error: ${statusData.result.error}`);
                setSnackbarOpen(true);
                setLoading(false);
                clearInterval(intervalId);
            } else {
                console.log('Processing...');
            }
        })
        .catch(error => {
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
    setData(prevData => ({
      ...prevData,
      fund: { ...prevData.fund, [field]: value }
    }));
  };

  const handleBenchmarkChange = (field, value) => {
    setData(prevData => ({
      ...prevData,
      benchmark: { ...prevData.benchmark, [field]: value }
    }));
  };

  const handleDataChange = (index, field, value) => {
    setData(prevData => {
      const updatedResiduals = prevData.residual_return_streams.map((residual, i) => {
        if (i === index) {
          return { ...residual, [field]: value };
        }
        if (field === 'description') {
          return {
            ...residual,
            residualization: residual.residualization.map(residualizationItem =>
              residualizationItem === prevData.residual_return_streams[index].description ? value : residualizationItem
            )
          };
        }
        return residual;
      });
      return {
        ...prevData,
        residual_return_streams: updatedResiduals
      };
    });
  };

  const handleRemoveRegression = (description) => {
    setData(prevData => {
      const updatedResiduals = prevData.residual_return_streams
        .filter(residual => residual.description !== description)
        .map(residual => ({
          ...residual,
          residualization: residual.residualization.filter(residualizationItem => residualizationItem !== description)
        }));
      return {
        ...prevData,
        residual_return_streams: updatedResiduals
      };
    });
  };

  const handleAddResidual = () => {
    setData(prevData => ({
      ...prevData,
      residual_return_streams: [...prevData.residual_return_streams, { description: `New Residual ${prevData.residual_return_streams.length + 1}`, source: '', residualization: [] }]
    }));
  };

  const handlePastedDataUpdate = (newData) => {
    console.log(newData);
    setData(prevData => ({
      ...prevData,
      fund: {
        ...prevData.fund,
        pastedData: newData
      }
    }));
  };

  const availableDescriptions = data.residual_return_streams.map(stream => stream.description);

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4">Return-Based Statistical Analysis</Typography>
      <Typography variant="b2">Upload and select return streams below</Typography>
      <div className="return-stream-accordions">
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ textAlign: 'left' }}>Fund</Typography>
          <FundReturnInput
            fund={data.fund}
            onDescriptionChange={handleFundDescriptionChange}
            updateFundReturns={handlePastedDataUpdate}
            pastedData={data.fund.pastedData} // Pass pastedData as a prop
          />
        </Box>
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ textAlign: 'left' }}>Benchmark</Typography>
          <BenchmarkInputs
            benchmarkData={data.benchmark}
            handleDescriptionChange={handleBenchmarkChange}
            handleStreamChange={handleBenchmarkChange}
          />
        </Box>
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ textAlign: 'left' }}>Regression Return Streams</Typography>
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
          <IconButton
            color="primary"
            onClick={handleAddResidual}
            sx={{
              backgroundColor: '#b2dfdb',  // A softer shade of teal
              color: 'white',
              '&:hover': {
                backgroundColor: '#82ada9',  // A darker, muted teal for hover
              },
              mt: 1,
              float: 'right'  // Aligns the button to the right
            }}
          >
            <AddIcon />
          </IconButton>
        </Box>
      </div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Button
          variant="outlined"
          color="secondary"
          className="reset-button"
          onClick={handleReset}
          sx={{
            padding: '6px 16px',
            borderColor: '#f44336',
            color: '#f44336',
            '&:hover': {
              backgroundColor: '#fce4ec',
              borderColor: '#f44336',
            }
          }}
        >
          Reset Page
        </Button>
        <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            className="submit-button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
          </Button>
        </Box>
      </Box>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SelectComparisons;