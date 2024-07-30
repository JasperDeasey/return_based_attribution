import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import UploadInvestmentReturns from './components/UploadInvestmentReturns/UploadInvestmentReturns';
import SelectComparisons from './components/SelectComparisons/SelectComparisons';
import AnalysisScreen from './components/AnalysisScreen/AnalysisScreen'; // Ensure you have this component
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<UploadInvestmentReturns />} />
          <Route path="/select-comparisons" element={<SelectComparisons />} />
          <Route path="/analysis" element={<AnalysisScreen />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;