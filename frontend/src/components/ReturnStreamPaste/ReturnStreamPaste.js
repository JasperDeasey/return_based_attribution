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
    onClear();
  };

  const handlePaste = useCallback(async (event) => {
    event.preventDefault();
    const clipboardData = await navigator.clipboard.readText();
    console.log('Raw clipboard data:', clipboardData); // Debugging log

    const parsedRows = clipboardData.split(/\r?\n/).map((row, index) => {
      const [date, returnValue] = row.split(/\t/);
      if (!date || !returnValue) {
        return null; // Skip rows that do not have both date and returnValue
      }
      console.log('Parsed row:', date, returnValue); // Debugging log
      let cleanedReturnValue = returnValue.trim().replace(/\r$/, ''); // Remove trailing carriage return character
      if (cleanedReturnValue.endsWith('%')) {
        cleanedReturnValue = (parseFloat(cleanedReturnValue.slice(0, -1)) / 100).toString();
      }
      return {
        id: index + 1,
        date: date.trim(), // Trims whitespace and line ending characters from the date
        return: cleanedReturnValue
      };
    }).filter(row => row); // Filter out any null rows

    console.log('Parsed rows:', parsedRows); // Debugging log
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
        pageSize={rows.length}
        // rowsPerPageOptions={[rows.length]}
        hideFooterSelectedRowCount // Hides "1 row selected"
        components={{
          Pagination: () => null // Removes "Rows per page" text
        }}
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
  onClear: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default ReturnStreamPaste;