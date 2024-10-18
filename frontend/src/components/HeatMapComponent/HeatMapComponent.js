// frontend/src/components/HeatMapComponent/HeatMapComponent.js

import React from 'react';
import HeatMap from 'react-heatmap-grid';
import { Box, Typography } from '@mui/material';

const HeatMapComponent = ({ data, xLabels, yLabels, title, metricType, centerValue }) => {
  // Filter out null and zero values for calculating min and max
  const allValues = data.flat().filter((val) => val != null);

  if (allValues.length === 0) {
    return (
      <Box width="100%" marginBottom="20px">
        <Typography variant="h6" align="center">{title}</Typography>
        <Typography align="center">No Data Available</Typography>
      </Box>
    );
  }

  // Set center value, defaulting to 0
  const center = centerValue != null ? centerValue : 0;

  // Calculate min and max values including zeros (since zero is meaningful)
  let maxValue, minValue;
  if (metricType === 'diverging') {
    const maxAbsValue = Math.max(...allValues.map(Math.abs));
    maxValue = maxAbsValue;
    minValue = -maxAbsValue;
  } else {
    maxValue = Math.max(...allValues);
    minValue = Math.min(...allValues);
  }

  const getColor = (value) => {
    if (value == null || value == 0) return '#d3d3d3'; // Grey for null values
    let red, green, blue;
  
    if (metricType === 'diverging') {
      const denom = maxValue - center;
      const ratio = denom !== 0 ? (value - center) / denom : 0;
  
      if (ratio > 0) {
        // Positive values: from white to green
        red = Math.floor(255 * (1 - ratio));
        green = 255;
        blue = Math.floor(255 * (1 - ratio));
      } else if (ratio < 0) {
        // Negative values: from white to red
        red = 255;
        green = Math.floor(255 * (1 + ratio));
        blue = Math.floor(255 * (1 + ratio));
      } else {
        // Zero value
        red = 255;
        green = 255;
        blue = 255;
      }
    } else if (metricType === 'p-value') {
      // P-value-specific coloring logic
      if (value === 0.05) {
        red = 255;
        green = 255;
        blue = 255; // White at p-value 0.05
      } else if (value < 0.05) {
        // For p-values < 0.05, scale to green
        const ratio = (0.05 - value) / 0.05; // How close to 0
        red = Math.floor(255 * (1 - ratio)); // Less red
        green = 255; // Full green
        blue = Math.floor(255 * (1 - ratio)); // Less blue
      } else if (value > 0.2) {
        // For p-values > 0.2, make it the deepest red
        red = 255;
        green = 0;
        blue = 0;
      } else {
        // For p-values between 0.05 and 0.2, scale to red
        const ratio = (value - 0.05) / (0.2 - 0.05); // Scale between 0.05 and 0.2
        red = 255; // Full red
        green = Math.floor(255 * (1 - ratio)); // Less green
        blue = Math.floor(255 * (1 - ratio)); // Less blue
      }
    } else {
      // Sequential scale
      const denom = maxValue - minValue;
      const ratio = denom !== 0 ? (value - minValue) / denom : 0;
      red = Math.floor(255 * (1 - ratio));
      green = Math.floor(255 * ratio);
      blue = 0;
    }
  
    return `rgb(${red}, ${green}, ${blue})`;
  };
  
  

    // Adjust xLabels to prevent overcrowding
    const maxLabels = Math.min(xLabels.length, Math.floor(window.innerWidth / 50));
    const skip = Math.ceil(xLabels.length / maxLabels);

  const adjustedXLabels = xLabels.map((label, idx) => {
    return idx % skip === 0 ? label : '';
  });

  const cellWidth = Math.floor((window.innerWidth - 100) / adjustedXLabels.length); // 100 for yLabelsWidth
  const baseFontSize = Math.min(12, Math.max(8, cellWidth / 4));

  return (
    <Box width="100%" marginBottom="20px">
      <Typography variant="h6" align="center">{title}</Typography>
      <Box sx={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <HeatMap
          xLabels={adjustedXLabels}
          yLabels={yLabels}
          data={data}
          squares={false}
          height={40}
          cellHeight={40}
          xLabelsLocation="bottom"
          xLabelWidth={50}
          yLabelWidth={100}
          xLabelsStyle={{
            color: '#777',
            fontSize: '10px',
            transform: 'rotate(-90deg)',
            textAlign: 'left',
            whiteSpace: 'nowrap',
            height: 'auto',
          }}
          yLabelsStyle={{
            color: '#777',
            fontSize: '11px',
            textAlign: 'right',
          }}
          cellStyle={(background, value, min, max, data, x, y) => ({
            background: getColor(value),
            fontSize: `${baseFontSize}px`,
            color: '#000',
            textAlign: 'center',
            cursor: 'default',
            padding: '0',
          })}
          cellRender={(value, x, y) => {
            const formattedValue = value === 0 ? '' : (value != null ? value.toFixed(2).replace(/^(-)?0\./, '$1.') : '');
            // Adjust font size based on the length of the formatted value
            const fontSize = formattedValue.length > 4 ? '6px' : '8px';
            return (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  lineHeight: 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: baseFontSize,
                  overflow: 'hidden',
                }}
              >
                {formattedValue}
              </div>
            );
          }}
        />
      </Box>
    </Box>
  );
};

export default HeatMapComponent;
