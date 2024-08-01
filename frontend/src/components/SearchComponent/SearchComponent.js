import React, { useState } from 'react';
import axios from 'axios';
import './SearchComponent.css';

const API_KEY = '9b844e8409a741cc8591e874a1c5f99f';

const SearchComponent = ({ onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async () => {
    try {
      const response = await axios.get('https://api.twelvedata.com/symbol_search', {
        params: {
          symbol: searchQuery,
          apikey: API_KEY,
        },
      });
      setSearchResults(response.data.data);
    } catch (error) {
      console.error('Error fetching search results', error);
    }
  };

  return (
    <div className="form-group">
      <label htmlFor="searchQuery">Search by Name:</label>
      <input
        type="text"
        id="searchQuery"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by Name"
      />
      <button onClick={handleSearch}>Search</button>
      {searchResults.length > 0 && (
        <ul className="search-results-list">
          {searchResults.map((result) => (
            <li key={result.symbol} onClick={() => onSelect(result.symbol, result.instrument_name)}>
              {result.instrument_name} ({result.symbol})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchComponent;