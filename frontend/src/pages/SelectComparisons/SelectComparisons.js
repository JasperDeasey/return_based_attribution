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

  useEffect(() => {
    console.log("State updated:", data);
  }, [data]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleSubmit = () => {
    if (data.fund.pastedData.length === 0) {
      setSnackbarMessage("Please paste fund returns above");
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    setSnackbarMessage("This may take a few minutes...");
    setSnackbarOpen(true);

    const url = 'http://127.0.0.1:5000/submit-data';  // Ensure this matches your backend address

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
      .then(data => {
        console.log('Processed Data:', data);
        navigate('/analysis', { state: { data } });
      })
      .catch(error => {
        console.error('Error:', error);
      })
      .finally(() => {
        setLoading(false);
      });
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
      <Button variant="contained" color="primary" className="submit-button" onClick={handleSubmit} disabled={loading}>
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
      </Button>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="info" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SelectComparisons;