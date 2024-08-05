import React, { useState, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import PropTypes from 'prop-types';
import { Box, Button } from '@mui/material';

const ReturnStreamPaste = ({ onClear, onSubmit }) => {
  const [rows, setRows] = useState([
    { id: 1, date: 'YYYY-MM-DD', return: '0.0XX' },
  ]);

  const columns = [
    { field: 'date', headerName: 'Date', width: 150, editable: true },
    { field: 'return', headerName: 'Monthly Return', width: 150, editable: true },
  ];

  const handleClear = () => {
    setRows([{ id: 1, date: 'YYYY-MM-DD', return: '0.0XX' }]);
    onClear()
  };

  const handlePaste = useCallback((event) => {
    event.preventDefault();
    const clipboardData = event.clipboardData.getData('Text');
    const parsedRows = clipboardData.split('\n').map((row, index) => {
      const [date, returnValue] = row.split('\t');
      return {
        id: index + 1,
        date: date.trim(), // Trims whitespace and line ending characters from the date
        return: returnValue.trim().replace(/\r$/, '') // Removes only the trailing carriage return character from return value
      };
    });
    setRows(parsedRows);
  }, []);

  const handleSubmit = () => {
    onSubmit(rows);  // Trigger the submission with the current state of rows
  };

  return (
    <Box sx={{ width: '100%', position: 'relative' }} onPaste={handlePaste}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        onCellClick={() => document.activeElement.blur()}
        sx={{ height: 300, '& .MuiDataGrid-footerContainer': { justifyContent: 'space-between' } }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, position: 'absolute', bottom: 0, right: 0, padding: 1 }}>
        <Button variant="contained" onClick={handleClear}>
          Clear
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          Submit
        </Button>
      </Box>
    </Box>
  );
};

ReturnStreamPaste.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default ReturnStreamPaste;