import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SelectComparisons.css';

const SelectComparisons = () => {
  const [benchmark, setBenchmark] = useState('ACWI');
  const [benchmarkDescription, setBenchmarkDescription] = useState('MSCI ACWI');
  const [returnStreams, setReturnStreams] = useState([
    { returnStream1: 'ACWI', returnStream2: 'SHV', description: 'Equity' },
    { returnStream1: 'IEF', returnStream2: 'SHV', description: 'US Interest Rate' },
    { returnStream1: 'LQD', returnStream2: 'SHV', description: 'US Credit' },
    { returnStream1: 'TIP', returnStream2: 'IEF', description: 'US Inflation' },
    { returnStream1: 'SPY', returnStream2: 'SHV', description: 'US Equity' },
    { returnStream1: 'PUTW', returnStream2: 'SHV', description: 'Equity Short Volatility' },
    { returnStream1: 'MTUM', returnStream2: '', description: 'Momentum' },
    { returnStream1: 'QUAL', returnStream2: '', description: 'Quality' },
    { returnStream1: 'VLUE', returnStream2: '', description: 'Value' },
    { returnStream1: 'IJR', returnStream2: '', description: 'Small Cap' },
  ]);

  const navigate = useNavigate();

  const handleAddStream = () => {
    setReturnStreams([...returnStreams, { returnStream1: '', returnStream2: '', description: 'Description' }]);
  };

  const handleRemoveStream = (index) => {
    const newReturnStreams = returnStreams.filter((_, i) => i !== index);
    setReturnStreams(newReturnStreams);
  };

  const handleStreamChange = (index, field, value) => {
    const newReturnStreams = returnStreams.map((stream, i) =>
      i === index ? { ...stream, [field]: value } : stream
    );
    setReturnStreams(newReturnStreams);
  };

  const handleSubmit = async () => {
    const payload = {
      benchmark,
      benchmarkDescription,
      returnStreams,
    };

    try {
      const response = await fetch('https://your-backend-endpoint.com/select-comparisons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      await response.json();
      navigate('/analysis');
    } catch (error) {
      alert('There was a problem with the selection: ' + error.message);
    }
  };

  return (
    <div className="select-comparisons-container">
      <h2>Select Comparisons</h2>
      <p>Select Yahoo Finance Tickers for a benchmark and regression inputs</p>
      <div className="form-group">
        <label htmlFor="benchmark">Benchmark Ticker:</label>
        <input
          type="text"
          id="benchmark"
          value={benchmark}
          onChange={(e) => setBenchmark(e.target.value)}
          placeholder="Benchmark Ticker"
        />
      </div>
      <div className="form-group">
        <label htmlFor="benchmarkDescription">Description:</label>
        <input
          type="text"
          id="benchmarkDescription"
          value={benchmarkDescription}
          onChange={(e) => setBenchmarkDescription(e.target.value)}
          placeholder="Benchmark Description"
        />
      </div>
      <div className="form-group">
        <label>Regression Return Streams:</label>
        <div className="return-streams-header">
          <span>Return Stream 1</span>
          <span>Optional: Minus Return Stream 2</span>
          <span>Description</span>
        </div>
        {returnStreams.map((stream, index) => (
          <div key={index} className="return-streams">
            <div className="return-stream-input">
              <input
                type="text"
                placeholder="Return Stream 1"
                value={stream.returnStream1}
                onChange={(e) => handleStreamChange(index, 'returnStream1', e.target.value)}
              />
              <p className="ticker-info">Placeholder for Ticker Info</p>
            </div>
            <span className="minus-sign">-</span>
            <div className="return-stream-input">
              <input
                type="text"
                placeholder="Return Stream 2"
                value={stream.returnStream2}
                onChange={(e) => handleStreamChange(index, 'returnStream2', e.target.value)}
              />
              <p className="ticker-info">Placeholder for Ticker Info</p>
            </div>
            <div className="return-stream-input">
              <input
                type="text"
                placeholder="Description"
                value={stream.description}
                onChange={(e) => handleStreamChange(index, 'description', e.target.value)}
              />
            </div>
            {returnStreams.length > 1 && (
              <button className="remove-button" onClick={() => handleRemoveStream(index)}>−</button>
            )}
          </div>
        ))}
        <button className="add-button" onClick={handleAddStream}>+</button>
      </div>
      <div className="footer">
        <button className="submit-button" onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
};

export default SelectComparisons;
