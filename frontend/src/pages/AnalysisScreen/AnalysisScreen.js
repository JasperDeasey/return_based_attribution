import React from 'react';
import './AnalysisScreen.css';
import { useLocation } from 'react-router-dom';
import LineChartComponent from '../../components/LineChartComponent/LineChartComponent';
import ChartSelection from '../../components/ChartSelection/ChartSelection'; // Correct the import path if necessary
import RegressionChartSelection from '../../components/RegressionChartSelection';
import ConeChartSelection from '../../components/ConeChartSelection';

const AnalysisScreen = () => {
  const location = useLocation();
  const data = location.state?.data;
  console.log("Received Data:", data);  // You can use this data as needed

  return (
    <div className="analysis-screen-container">
      <h2>Analysis</h2>
      {data && (
        <>
        <div className="chart-section">
            <h3>Cone Chart</h3>
            <ConeChartSelection data={data} metric="cone_chart" />
          </div>
          <LineChartComponent chartData={data.cone_chart} />
          <div className="chart-section">
            <h3>Rolling Return</h3>
            <ChartSelection data={data} metric="rolling_return" />
          </div>
          <div className="chart-section">
            <h3>Rolling Volatility</h3>
            <ChartSelection data={data} metric="rolling_volatility" />
          </div>
          <div className="chart-section">
            <h3>Regression Models</h3>
            <RegressionChartSelection data={data} metric="regression_metric" />
          </div>
        </>
      )}
    </div>
  );
};

export default AnalysisScreen;