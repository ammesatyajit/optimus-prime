# app.py
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Paths
CSV_FILE_PATH = 'data.csv'  # Ensure this path is correct
OUTPUT_JSON_PATH = 'highlights.json'  # Path where the JSON will be saved

# Read the entire CSV into a Pandas DataFrame once when the server starts
try:
    df = pd.read_csv(CSV_FILE_PATH, encoding='utf-8', dtype=str)  # dtype=str to handle all data as strings
    total_rows = len(df)
    columns = list(df.columns)
    if 'id' not in columns:
        raise ValueError("CSV must contain an 'id' column.")
    print(f"Loaded CSV with {total_rows} rows and columns: {columns}")
except Exception as e:
    print(f"Error reading CSV file: {e}")
    df = pd.DataFrame()
    total_rows = 0
    columns = []

@app.route('/')
def index():
    return 'Flask server is running.'

@app.route('/api/columns', methods=['GET'])
def get_columns():
    if columns:
        return jsonify({'columns': columns})
    else:
        return jsonify({'error': 'No columns found.'}), 500

@app.route('/api/row/<int:row_index>', methods=['GET'])
def get_row(row_index):
    if 0 <= row_index < total_rows:
        row = df.iloc[row_index].to_dict()
        return jsonify({'row': row, 'total_rows': total_rows})
    else:
        return jsonify({'error': 'Row index out of range'}), 400

@app.route('/api/highlights', methods=['POST'])
def receive_highlights():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided.'}), 400

    selected_column = data.get('selected_column')
    highlights = data.get('highlights')

    if not selected_column:
        return jsonify({'error': 'selected_column is missing.'}), 400

    if not highlights:
        return jsonify({'error': 'highlights data is missing.'}), 400

    # Validate that selected_column exists in the CSV
    if selected_column not in columns:
        return jsonify({'error': f'selected_column "{selected_column}" does not exist in the CSV.'}), 400

    # Prepare a dictionary to hold id and highlighted indices
    highlights_json = {}

    # Iterate through the highlights to map id to highlighted indices
    for row_index, highlighted_indices in highlights.items():
        if not isinstance(highlighted_indices, list):
            return jsonify({'error': f'Invalid data format for row {row_index}.'}), 400
        # Validate that highlighted_indices are integers
        if not all(isinstance(idx, int) for idx in highlighted_indices):
            return jsonify({'error': f'Non-integer token index in row {row_index}.'}), 400
        # Validate that the token indices are even
        if not all(idx % 2 == 0 for idx in highlighted_indices):
            return jsonify({'error': f'Token indices must be even numbers in row {row_index}.'}), 400
        # Validate that the row index is within range
        row_num = int(row_index)
        if row_num >= total_rows:
            return jsonify({'error': f'Row index {row_num} out of range.'}), 400
        # Retrieve the id for the current row
        row_id = df.iloc[row_num]['id']
        # Divide each token index by 2
        processed_indices = [idx // 2 for idx in highlighted_indices]
        # Map id to processed indices
        highlights_json[row_id] = processed_indices

    # Save the highlights_json to a JSON file
    try:
        # If the JSON file already exists, load its content
        if os.path.exists(OUTPUT_JSON_PATH):
            with open(OUTPUT_JSON_PATH, 'r') as f:
                existing_data = json.load(f)
        else:
            existing_data = {}

        # Update existing data with new highlights
        existing_data.update(highlights_json)

        # Write the updated data back to the JSON file
        with open(OUTPUT_JSON_PATH, 'w') as f:
            json.dump(existing_data, f, indent=4)

    except Exception as e:
        print(f"Error writing to JSON file: {e}")
        return jsonify({'error': 'Failed to save highlights to JSON file.'}), 500

    print(f"Highlights saved to {OUTPUT_JSON_PATH} successfully.")
    return jsonify({'message': f'Highlights saved to {OUTPUT_JSON_PATH} successfully.'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5001)
