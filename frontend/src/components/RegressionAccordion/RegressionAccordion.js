import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  IconButton,
  TextField,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchComponent from '../SearchComponent';
import SelectResidual from '../SelectResidual';

const RegressionAccordion = ({
    index,
    returnStream,
    handleDataChange,
    onRemove,
    availableDescriptions,
}) => {
  const [desc, setDesc] = useState(returnStream.description);
  const [expanded, setExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(returnStream.source || '');
  const [residuals, setResiduals] = useState(returnStream.residualization || []);

  useEffect(() => {
    setDesc(returnStream.description);
    setSelectedIndex(returnStream.source || '');
    setResiduals(returnStream.residualization);
  }, [returnStream]);

  const handleChange = (event, isExpanded) => {
    setExpanded(isExpanded);
  };

  const handleSelectIndex = (selectedIndex) => {
    setSelectedIndex(selectedIndex);
    handleDataChange(index, 'source', selectedIndex);
  };

  const handleAddResidual = (residual) => {
    const newResiduals = [...residuals, residual];
    setResiduals(newResiduals);
    handleDataChange(index, 'residualization', newResiduals);
  };

  const handleDeleteResidual = (residual) => {
    const newResiduals = residuals.filter(r => r !== residual);
    setResiduals(newResiduals);
    handleDataChange(index, 'residualization', newResiduals);
  };

  const handleBlur = () => {
    handleDataChange(index, 'description', desc);
  };

  return (
    <Accordion expanded={expanded} onChange={handleChange}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <TextField
            label="Description"
            variant="outlined"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={handleBlur}
            InputLabelProps={{ shrink: true }}
            sx={{ width: `${desc.length + 2}ch`, minWidth: '150px' }}
            onClick={(event) => event.stopPropagation()}
          />
          {selectedIndex && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', ml: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Primary Return Stream
              </Typography>
              <Chip label={selectedIndex} sx={{ backgroundColor: 'lightblue' }} />
            </Box>
          )}
          {residuals.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', ml: 2, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Residualized Against
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                {residuals.map((residual, i) => (
                  <Chip key={i} label={residual} sx={{ backgroundColor: 'lightgrey' }} onDelete={() => handleDeleteResidual(residual)} />
                ))}
              </Box>
            </Box>
          )}
        </Box>
        <IconButton
          onClick={(event) => {
            event.stopPropagation();
            onRemove(returnStream.description);
          }}
        >
          <DeleteIcon />
        </IconButton>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ width: '100%' }}>
          <SearchComponent onSelect={handleSelectIndex} />
          <SelectResidual onSelect={handleAddResidual} availableDescriptions={availableDescriptions} />
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default RegressionAccordion;