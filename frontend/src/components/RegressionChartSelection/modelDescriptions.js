// frontend/src/components/RegressionChartSelection/modelDescriptions.js

import React from 'react';
import { Typography } from '@mui/material';

const modelDescriptions = {
  OLS: (
    <>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'white' }}>
        Ordinary Least Squares (OLS) Regression
      </Typography>
      <Typography variant="body2" sx={{ color: '#d3d3d3' }}>
        OLS Regression estimates the relationship between a dependent variable (e.g., financial return) and one or more independent variables (e.g., market factors) by minimizing the sum of the squared differences between observed and predicted values. In our analysis, the intercept is set to zero, aligning with financial modeling practices where no inherent bias (alpha) is assumed in the returns being analyzed.
      </Typography>
    </>
  ),
  Ridge: (
    <>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'white' }}>
        Ridge Regression
      </Typography>
      <Typography variant="body2" sx={{ color: '#d3d3d3' }}>
        Ridge Regression extends OLS by adding a penalty term to shrink the regression coefficients. This helps prevent overfitting, especially when dealing with multicollinearity (when independent variables are highly correlated). By controlling the size of the coefficients, Ridge Regression produces more reliable models in financial analysis.
      </Typography>
    </>
  ),
  Lasso: (
    <>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'white' }}>
        Least Absolute Shrinkage and Selection Operator (Lasso) Regression
      </Typography>
      <Typography variant="body2" sx={{ color: '#d3d3d3' }}>
        Lasso Regression is a variant of linear regression that not only shrinks coefficients like Ridge but can also set some coefficients exactly to zero. This feature makes Lasso useful for feature selection, helping to identify the most significant factors influencing financial returns by eliminating less important variables. In our analysis, the intercept is set to zero, adhering to financial modeling conventions where an inherent bias is not assumed.
      </Typography>
    </>
  ),
};

export default modelDescriptions;
