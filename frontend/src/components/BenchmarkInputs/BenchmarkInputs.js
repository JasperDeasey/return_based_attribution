import React from 'react';
import './BenchmarkInputs.css';

const BenchmarkInputs = ({ benchmark, setBenchmark, benchmarkDescription, setBenchmarkDescription }) => {
  return (
    <div className="benchmark-inputs">
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
    </div>
  );
};

export default BenchmarkInputs;