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

  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    const parsedData = JSON.parse(event.data);
    if (parsedData.status === "processing") {
      console.log("Processing...");
    } else {
      console.log('Processed Data:', parsedData);
      navigate('/analysis', { state: { data: parsedData } });
      eventSource.close();
      setLoading(false);
    }
  };

  eventSource.onerror = (error) => {
    console.error('Error:', error);
    setSnackbarSeverity('error');
    setSnackbarMessage(`Error: ${error.message}`);
    setSnackbarOpen(true);
    eventSource.close();
    setLoading(false);
  };
};

    eventSource.onerror = (error) => {
        console.error('Error:', error);
        setSnackbarSeverity('error');
        setSnackbarMessage(`Error: ${error.message}`);
        setSnackbarOpen(true);
        setLoading(false);
        eventSource.close();
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }).catch((error) => {
        console.error('Error:', error);
        setSnackbarSeverity('error');
        setSnackbarMessage(`Error: ${error.message}`);
        setSnackbarOpen(true);
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
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SelectComparisons;