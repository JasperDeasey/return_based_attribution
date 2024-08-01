import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchComponent from '../../components/SearchComponent/SearchComponent';
import BenchmarkInputs from '../../components/BenchmarkInputs/BenchmarkInputs';
import ReturnStreamAccordion from '../../components/ReturnStreamAccordion/ReturnStreamAccordion';
import { Button } from '@mui/material';
import './SelectComparisons.css';

const API_KEY = '9b844e8409a741cc8591e874a1c5f99f';

const SelectComparisons = () => {
  const [benchmark, setBenchmark] = useState('ACWI');
  const [benchmarkDescription, setBenchmarkDescription] = useState('MSCI ACWI');
  const [returnStreams, setReturnStreams] = useState([
    { returnStream1: 'ACWI', returnStream2: 'SHV', description: 'Equity', name1: 'MSCI ACWI', name2: 'iShares Short Treasury Bond ETF' },
    { returnStream1: 'IEF', returnStream2: 'SHV', description: 'US Interest Rate', name1: 'iShares 7-10 Year Treasury Bond ETF', name2: 'iShares Short Treasury Bond ETF' },
    { returnStream1: 'LQD', returnStream2: 'SHV', description: 'US Credit', name1: 'iShares iBoxx $ Investment Grade Corporate Bond ETF', name2: 'iShares Short Treasury Bond ETF' },
    { returnStream1: 'TIP', returnStream2: 'IEF', description: 'US Inflation', name1: 'iShares TIPS Bond ETF', name2: 'iShares 7-10 Year Treasury Bond ETF' },
    { returnStream1: 'SPY', returnStream2: 'SHV', description: 'US Equity', name1: 'SPDR S&P 500 ETF Trust', name2: 'iShares Short Treasury Bond ETF' },
    { returnStream1: 'PUTW', returnStream2: 'SHV', description: 'Equity Short Volatility', name1: 'WisdomTree CBOE S&P 500 PutWrite Strategy Fund', name2: 'iShares Short Treasury Bond ETF' },
    { returnStream1: 'MTUM', returnStream2: '', description: 'Momentum', name1: 'iShares MSCI USA Momentum Factor ETF', name2: '' },
    { returnStream1: 'QUAL', returnStream2: '', description: 'Quality', name1: 'iShares MSCI USA Quality Factor ETF', name2: '' },
    { returnStream1: 'VLUE', returnStream2: '', description: 'Value', name1: 'iShares MSCI USA Value Factor ETF', name2: '' },
    { returnStream1: 'IJR', returnStream2: '', description: 'Small Cap', name1: 'iShares Core S&P Small-Cap ETF', name2: '' },
  ]);

  const navigate = useNavigate();

  const handleAddStream = () => {
    setReturnStreams([...returnStreams, { returnStream1: '', returnStream2: '', description: 'Description', name1: '', name2: '' }]);
  };

  const handleRemoveStream = (index) => {
    const newReturnStreams = returnStreams.filter((_, i) => i !== index);
    setReturnStreams(newReturnStreams);
  };

  const handleStreamChange = (index, field, value) => {
    const newReturnStreams = returnStreams.map((stream, i) => (i === index ? { ...stream, [field]: value } : stream));
    setReturnStreams(newReturnStreams);
  };

  const handleSearchResultClick = (symbol, instrument_name) => {
    setBenchmark(symbol);
    setBenchmarkDescription(instrument_name);
  };

  const handleSubmit = () => {
    console.log({
      benchmark,
      benchmarkDescription,
      returnStreams,
    });
    navigate('/analysis');
  };

  return (
    <div className="select-comparisons-container">
      <h2>Select Comparisons</h2>
      <SearchComponent onSelect={handleSearchResultClick} />
      <BenchmarkInputs
        benchmark={benchmark}
        setBenchmark={setBenchmark}
        benchmarkDescription={benchmarkDescription}
        setBenchmarkDescription={setBenchmarkDescription}
      />
      <div className="return-stream-accordions">
        {returnStreams.map((stream, index) => (
          <ReturnStreamAccordion
            key={index}
            returnStream={stream}
            apiKey={API_KEY}
            index={index}
            handleStreamChange={handleStreamChange}
            handleRemoveStream={handleRemoveStream}
          />
        ))}
      </div>
      <div className="footer">
        <Button variant="contained" style={{ backgroundColor: 'seafoamgreen' }} className="add-button" onClick={handleAddStream}>Add Return Stream</Button>
        <Button variant="contained" color="primary" className="submit-button" onClick={handleSubmit}>Submit</Button>
      </div>
    </div>
  );
};

export default SelectComparisons;