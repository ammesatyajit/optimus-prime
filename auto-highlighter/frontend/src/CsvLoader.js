// CsvLoader.js
import React, { useState, useEffect } from 'react';

const CsvLoader = ({ onTotalRowsReceived, onColumnChange }) => {
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [loading, setLoading] = useState(true); // Start with loading
  const [error, setError] = useState('');

  useEffect(() => {
    // Backend base URL (adjusted to port 5001)
    const backendBaseUrl = 'http://localhost:5001';

    // Fetch column names from the backend
    const fetchColumns = async () => {
      try {
        console.log('Fetching columns from backend...');
        const response = await fetch(`${backendBaseUrl}/api/columns`);
        if (!response.ok) {
          throw new Error(`Error fetching columns: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.columns && Array.isArray(data.columns)) {
          setColumns(data.columns);
          console.log('Columns received:', data.columns);
        } else {
          throw new Error('Invalid data format for columns.');
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    // Fetch total rows from the backend by requesting row 0
    const fetchTotalRows = async () => {
      try {
        console.log('Fetching total rows from backend...');
        const response = await fetch(`${backendBaseUrl}/api/row/0`);
        if (!response.ok) {
          throw new Error(`Error fetching total rows: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.total_rows) {
          onTotalRowsReceived(data.total_rows);
          console.log('Total rows received:', data.total_rows);
        } else {
          throw new Error('Invalid data format for total rows.');
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    // Execute both fetches concurrently
    const fetchData = async () => {
      await Promise.all([fetchColumns(), fetchTotalRows()]);
      setLoading(false);
    };

    fetchData();
  }, [onTotalRowsReceived]);

  const handleColumnSelect = (e) => {
    const column = e.target.value;
    setSelectedColumn(column);
    onColumnChange(column);
    console.log('User selected column:', column);
  };

  if (loading) {
    return <div>Loading columns...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <h2>Select a Column to Highlight</h2>
      <select
        value={selectedColumn}
        onChange={handleColumnSelect}
        style={styles.select}
      >
        <option value="">-- Select a Column --</option>
        {columns.map((column) => (
          <option key={column} value={column}>
            {column}
          </option>
        ))}
      </select>
    </div>
  );
};

// Optional: Inline styles for basic styling
const styles = {
  container: {
    margin: '20px 0',
    textAlign: 'center',
  },
  select: {
    padding: '10px',
    fontSize: '16px',
    width: '60%',
    maxWidth: '300px',
  },
};

export default CsvLoader;
