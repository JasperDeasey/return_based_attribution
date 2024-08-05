import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SelectComparisons from './pages/SelectComparisons/SelectComparisons';
import AnalysisScreen from './pages/AnalysisScreen/AnalysisScreen'; // Ensure you have this component
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<SelectComparisons />} />
          <Route path="/analysis" element={<AnalysisScreen />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;