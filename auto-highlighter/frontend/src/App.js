// App.js
import React, { useState } from 'react';
import CsvLoader from './CsvLoader';
import Highlighter from './Highlighter';

const App = () => {
  const [totalRows, setTotalRows] = useState(0);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [highlights, setHighlights] = useState({}); // Store highlights per row index
  const [submitStatus, setSubmitStatus] = useState(''); // To display submission status

  // Callback to receive total rows from CsvLoader
  const handleTotalRowsReceived = (total) => {
    setTotalRows(total);
    console.log('Total Rows:', total);
  };

  // Callback to receive selected column from CsvLoader
  const handleColumnChange = (column) => {
    setSelectedColumn(column);
    setHighlights({}); // Reset highlights when column changes
    console.log('Selected Column:', column);
  };

  // Callback to receive highlights from Highlighter
  const handleHighlightsChanged = (rowIndex, highlightedIndices) => {
    setHighlights((prevHighlights) => ({
      ...prevHighlights,
      [rowIndex]: highlightedIndices,
    }));
    console.log(`Highlights for row ${rowIndex}:`, highlightedIndices);
  };

  // Function to submit highlights to the backend
  const submitHighlights = async () => {
    try {
      console.log('Submitting highlights to backend...');
      const response = await fetch('http://localhost:5001/api/highlights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selected_column: selectedColumn, highlights }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('Highlights submitted successfully!');
        console.log(data.message);
      } else {
        setSubmitStatus(`Error: ${data.error}`);
        console.error(data.error);
      }
    } catch (error) {
      setSubmitStatus(`Error: ${error.message}`);
      console.error('Error submitting highlights:', error);
    }
  };

  // Function to export highlights as JSON
  const exportHighlights = () => {
    const dataStr = JSON.stringify(highlights, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'highlights.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to export highlights as CSV
  const exportHighlightsAsCSV = () => {
    const rows = Object.keys(highlights).map((rowIndex) => ({
      Row: parseInt(rowIndex) + 1,
      HighlightedTokens: highlights[rowIndex].join('; '),
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,Row,HighlightedTokens\n' +
      rows.map((row) => `${row.Row},${row.HighlightedTokens}`).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = 'highlights.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="App" style={styles.container}>
      <h1 style={styles.header}>Auto Highlighter</h1>
      <CsvLoader
        onTotalRowsReceived={handleTotalRowsReceived}
        onColumnChange={handleColumnChange}
      />
      {selectedColumn && totalRows > 0 && (
        <Highlighter
          selectedColumn={selectedColumn}
          totalRows={totalRows}
          onHighlightsChanged={handleHighlightsChanged}
        />
      )}
      {/* Display Highlights */}
      <HighlightsDisplay highlights={highlights} />
      {/* Submit and Export Buttons */}
      {Object.keys(highlights).length > 0 && (
        <div style={styles.buttonGroup}>
          <button onClick={submitHighlights} style={styles.submitButton}>
            Submit All Highlights
          </button>
          <button onClick={exportHighlights} style={styles.exportButton}>
            Export as JSON
          </button>
          <button onClick={exportHighlightsAsCSV} style={styles.exportButton}>
            Export as CSV
          </button>
        </div>
      )}
      {/* Submission Status */}
      {submitStatus && <p style={styles.status}>{submitStatus}</p>}
    </div>
  );
};

// HighlightsDisplay component
const HighlightsDisplay = ({ highlights }) => {
  const rowIndices = Object.keys(highlights).sort((a, b) => a - b);

  if (rowIndices.length === 0) {
    return null; // Don't display anything if there are no highlights
  }

  return (
    <div style={styles.highlightsContainer}>
      <h2>Highlighted Tokens</h2>
      {rowIndices.map((rowIndex) => (
        <div key={rowIndex} style={styles.highlightRow}>
          <strong>Row {parseInt(rowIndex) + 1}:</strong>{' '}
          {highlights[rowIndex].length > 0
            ? highlights[rowIndex].join(', ')
            : 'No highlights'}
        </div>
      ))}
    </div>
  );
};

// Inline styles for basic styling
const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    textAlign: 'center',
  },
  highlightsContainer: {
    marginTop: '40px',
    padding: '20px',
    borderTop: '1px solid #ccc',
  },
  highlightRow: {
    marginBottom: '10px',
  },
  buttonGroup: {
    marginTop: '20px',
    textAlign: 'center',
  },
  submitButton: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    marginRight: '10px',
  },
  exportButton: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    marginRight: '10px',
  },
  status: {
    marginTop: '10px',
    textAlign: 'center',
    color: 'green',
  },
};

export default App;
