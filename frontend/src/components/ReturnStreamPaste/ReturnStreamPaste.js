import React, { useEffect } from 'react';
import { TextField, Typography, Box } from '@mui/material';
import PropTypes from 'prop-types';
import './ReturnStreamPaste.css';

const ReturnStreamPaste = ({ data, setData, exampleData }) => {
  const handlePaste = (event) => {
    const paste = event.clipboardData.getData('Text');
    setData(paste);
  };

  return (
    <Box sx={{ position: 'relative', marginBottom: 2 }}>
      <TextField
        label="Paste Area"
        variant="outlined"
        multiline
        fullWidth
        minRows={4}
        onPaste={handlePaste}
        value={data}
        onChange={(e) => setData(e.target.value)}
      />
      {!data && (
        <Typography
          component="pre"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: '16.5px 14px',
            pointerEvents: 'none',
            opacity: 0.5,
            color: 'gray'
          }}
        >
          {exampleData}
        </Typography>
      )}
    </Box>
  );
};

ReturnStreamPaste.propTypes = {
  data: PropTypes.string.isRequired,
  setData: PropTypes.func.isRequired,
  exampleData: PropTypes.string.isRequired,
};

export default ReturnStreamPaste;
