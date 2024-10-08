// Highlighter.js
import React, { useState, useEffect } from 'react';

const Highlighter = ({ selectedColumn, totalRows, onHighlightsChanged }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTokens, setCurrentTokens] = useState([]);
  const [highlightedTokens, setHighlightedTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedColumn) return;

    // Backend base URL (adjusted to port 5001)
    const backendBaseUrl = 'http://localhost:5001';

    const fetchRow = async () => {
      setLoading(true);
      setError('');

      try {
        console.log(`Fetching row ${currentIndex} from backend...`);
        const response = await fetch(`${backendBaseUrl}/api/row/${currentIndex}`);
        if (!response.ok) {
          throw new Error(`Error fetching row: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Row data received:', data);

        if (data.row && selectedColumn in data.row) {
          const text = data.row[selectedColumn];
          if (text) {
            // Split the text into tokens, preserving whitespace and punctuation
            const tokens = text.match(/\S+|\s+|\n/g) || [];
            setCurrentTokens(tokens);
            setHighlightedTokens([]);
            console.log(`Row ${currentIndex} data:`, text);
          } else {
            setCurrentTokens([]);
            setError('No data in the selected column for this row.');
          }
        } else {
          setError('Selected column does not exist in the row data.');
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      }

      setLoading(false);
    };

    fetchRow();
  }, [currentIndex, selectedColumn]);

  const handleTokenClick = (index) => {
    setHighlightedTokens((prevTokens) =>
      prevTokens.includes(index)
        ? prevTokens.filter((i) => i !== index)
        : [...prevTokens, index]
    );
    console.log(`Highlighted tokens in row ${currentIndex}:`, highlightedTokens);
  };

  const handleSubmit = () => {
    const highlightedIndices = highlightedTokens;
    onHighlightsChanged(currentIndex, highlightedIndices);
    console.log(`Submitting highlights for row ${currentIndex}:`, highlightedIndices);

    if (currentIndex + 1 < totalRows) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert('You have reached the end of the CSV file.');
    }
  };

  return (
    <div style={styles.container}>
      <h2>
        Highlight Important Tokens (Row {currentIndex + 1} of {totalRows})
      </h2>
      {loading ? (
        <div>Loading row data...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>Error: {error}</div>
      ) : currentTokens.length > 0 ? (
        <div style={styles.textContainer}>
          <p style={styles.text}>
            {currentTokens.map((token, index) => {
              const isWord = token.trim().length > 0 && !/^\s+$/.test(token);
              return (
                <span
                  key={index}
                  onClick={isWord ? () => handleTokenClick(index) : undefined}
                  style={{
                    cursor: isWord ? 'pointer' : 'default',
                    backgroundColor: highlightedTokens.includes(index)
                      ? 'yellow'
                      : 'transparent',
                  }}
                >
                  {token}
                </span>
              );
            })}
          </p>
          <button onClick={handleSubmit} style={styles.button}>
            Submit Highlight
          </button>
        </div>
      ) : (
        <div>No data available in this column for the current row.</div>
      )}
    </div>
  );
};

// Inline styles for basic styling
const styles = {
  container: {
    marginTop: '30px',
    textAlign: 'center',
  },
  textContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'left',
    border: '1px solid #ccc',
    padding: '15px',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
  },
  text: {
    whiteSpace: 'pre-wrap',
    lineHeight: '1.5em',
  },
  button: {
    marginTop: '15px',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
  },
};

export default Highlighter;
