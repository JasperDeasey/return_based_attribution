import React from 'react';
import './ReturnStreamInputs.css';

const ReturnStreamInputs = ({ returnStreams, handleStreamChange, handleAddStream, handleRemoveStream }) => {
  return (
    <div className="form-group">
      <label>Regression Return Streams:</label>
      <div className="return-streams-header">
        <span>Return Stream 1</span>
        <span>Optional: Minus Return Stream 2</span>
        <span>Description</span>
      </div>
      {returnStreams.map((stream, index) => (
        <div key={index} className="return-streams">
          <div className="return-stream-input">
            <input
              type="text"
              placeholder="Return Stream 1"
              value={stream.returnStream1}
              onChange={(e) => handleStreamChange(index, 'returnStream1', e.target.value)}
            />
            <p className="ticker-info">{stream.name1}</p>
          </div>
          <span className="minus-sign">-</span>
          <div className="return-stream-input">
            <input
              type="text"
              placeholder="Return Stream 2"
              value={stream.returnStream2}
              onChange={(e) => handleStreamChange(index, 'returnStream2', e.target.value)}
            />
            <p className="ticker-info">{stream.name2}</p>
          </div>
          <div className="return-stream-input">
            <input
              type="text"
              placeholder="Description"
              value={stream.description}
              onChange={(e) => handleStreamChange(index, 'description', e.target.value)}
            />
          </div>
          {returnStreams.length > 1 && (
            <button className="remove-button" onClick={() => handleRemoveStream(index)}>−</button>
          )}
        </div>
      ))}
      <button className="add-button" onClick={handleAddStream}>+</button>
    </div>
  );
};

export default ReturnStreamInputs;