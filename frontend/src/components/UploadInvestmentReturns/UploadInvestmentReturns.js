import React, { useState } from 'react';
import './UploadInvestmentReturns.css';

const UploadInvestmentReturns = () => {
  const [data, setData] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [fundName, setFundName] = useState('');
  const exampleData = 'YYYY-MM-DD | 0.0123\nYYYY-MM-DD | 0.0456';

  const handlePaste = (event) => {
    const paste = event.clipboardData.getData('Text');
    setData(paste);
  };

  const handleUpload = async () => {
    const payload = {
      fundName,
      currency,
      returnsData: data,
    };

    try {
      const response = await fetch('https://your-backend-endpoint.com/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const responseData = await response.json();
      alert('Data uploaded successfully: ' + JSON.stringify(responseData));
    } catch (error) {
      alert('There was a problem with the upload: ' + error.message);
    }
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
      <div className="footer">
        <button className="cancel-button" onClick={() => setData('')}>Cancel</button>
        <button className="upload-button" onClick={handleUpload}>Upload</button>
      </div>
    </div>
  );
};

export default UploadInvestmentReturns;
