import os
import io
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import pandas as pd
import numpy as np

from services.validation import validate_dataframe
from services.cleaning import clean_dataframe
from services.analysis import analyze_dataframe, clean_for_json

app = Flask(__name__)
# Enable CORS for local development
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB maximum upload limit
SAMPLE_DATA_DIR = os.path.join(os.path.dirname(__file__), 'sample_data')

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# Sample dataset definitions
SAMPLES_METADATA = [
    {
        "id": "student_performance",
        "name": "Student Exam Performance",
        "filename": "student_performance.csv",
        "description": "Educational dataset tracking study hours, attendance, parental education, and test scores. Contains missing values and duplicates for cleaning practice.",
        "target_variable": "final_score",
        "task_type": "Regression",
        "source_type": "Sample Data"
    },
    {
        "id": "house_prices",
        "name": "Residential Real Estate Valuation",
        "filename": "house_prices.csv",
        "description": "Property market dataset with square footage, bedrooms, location type, and pricing. Features null values and duplicate listings.",
        "target_variable": "price_in_lakhs",
        "task_type": "Regression",
        "source_type": "Sample Data"
    }
]

def df_to_payload(df: pd.DataFrame) -> dict:
    """Helper to convert DataFrame to clean, JSON-serializable columns and rows."""
    columns = [str(c) for c in df.columns]
    records = []
    for _, row in df.iterrows():
        record = {str(k): clean_for_json(v) for k, v in row.items()}
        records.append(record)
    return {
        "columns": columns,
        "rows": records,
        "total_rows": len(df),
        "total_columns": len(columns)
    }

def payload_to_df(columns: list, rows: list) -> pd.DataFrame:
    """Helper to reconstruct DataFrame safely from received JSON payload."""
    if not columns or not rows:
        return pd.DataFrame()
    # Normalize empty strings to None/np.nan
    clean_rows = []
    for r in rows:
        cleaned_row = {}
        for c in columns:
            val = r.get(c, None)
            if val == "" or val is None or val == "null" or val == "NaN":
                cleaned_row[c] = np.nan
            else:
                cleaned_row[c] = val
        clean_rows.append(cleaned_row)
    
    df = pd.DataFrame(clean_rows, columns=columns)
    # Infer automatic numeric conversions
    for col in df.columns:
        try:
            df[col] = pd.to_numeric(df[col])
        except (ValueError, TypeError):
            pass
    return df

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        "error": "File size exceeds the 10MB limit. Please upload a smaller dataset."
    }), 413

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({
        "error": "An unexpected error occurred while processing the dataset. Please verify your data format."
    }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Data Collection for ML - Backend API",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/samples', methods=['GET'])
def get_sample_datasets():
    """Returns available bundled sample datasets."""
    return jsonify({"samples": SAMPLES_METADATA})

@app.route('/api/samples/<sample_id>', methods=['GET'])
def load_sample_dataset(sample_id):
    """Loads a specific bundled sample dataset from disk and validates it."""
    sample_info = next((s for s in SAMPLES_METADATA if s["id"] == sample_id), None)
    if not sample_info:
        return jsonify({"error": f"Sample dataset '{sample_id}' not found."}), 404

    file_path = os.path.join(SAMPLE_DATA_DIR, sample_info["filename"])
    if not os.path.exists(file_path):
        return jsonify({"error": "Sample data file is missing from server."}), 500

    try:
        df = pd.read_csv(file_path)
        payload = df_to_payload(df)
        validation_report = validate_dataframe(df)

        return jsonify({
            "id": sample_info["id"],
            "name": sample_info["name"],
            "description": sample_info["description"],
            "source_type": sample_info["source_type"],
            "target_variable": sample_info.get("target_variable"),
            "task_type": sample_info.get("task_type"),
            "collected_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "columns": payload["columns"],
            "rows": payload["rows"],
            "total_rows": payload["total_rows"],
            "total_columns": payload["total_columns"],
            "validation": validation_report
        })
    except Exception as e:
        logger.error(f"Error loading sample dataset: {e}")
        return jsonify({"error": f"Failed to parse sample file: {str(e)}"}), 500

@app.route('/api/upload', methods=['POST'])
def upload_dataset():
    """Handles CSV or JSON file uploads safely."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request."}), 400

    file = request.files['file']
    dataset_name = request.form.get('name', '').strip() or file.filename.rsplit('.', 1)[0]
    description = request.form.get('description', '').strip() or 'User uploaded dataset'

    if file.filename == '':
        return jsonify({"error": "No file was selected for upload."}), 400

    filename = file.filename.lower()
    allowed_extensions = ('.csv', '.txt', '.json')
    if not any(filename.endswith(ext) for ext in allowed_extensions):
        return jsonify({
            "error": "Unsupported file format. Please upload a standard CSV or JSON file."
        }), 400

    try:
        file_bytes = file.read()
        if len(file_bytes) == 0:
            return jsonify({"error": "Uploaded file is empty (0 bytes)."}), 400

        # Attempt to read CSV with encoding fallbacks
        df = None
        if filename.endswith('.json'):
            try:
                json_data = json.loads(file_bytes.decode('utf-8'))
                df = pd.DataFrame(json_data)
            except Exception:
                return jsonify({"error": "Invalid JSON format. Expected an array of record objects."}), 400
        else:
            # CSV / text parsing
            encodings = ['utf-8', 'latin-1', 'cp1252']
            for enc in encodings:
                try:
                    df = pd.read_csv(io.BytesIO(file_bytes), encoding=enc)
                    break
                except UnicodeDecodeError:
                    continue
                except Exception as csv_err:
                    return jsonify({"error": f"Error parsing CSV structure: {str(csv_err)}"}), 400

        if df is None or df.empty:
            return jsonify({"error": "Dataset could not be read or contains 0 records."}), 400

        # Clean column names (strip whitespace)
        df.columns = [str(c).strip() for c in df.columns]

        payload = df_to_payload(df)
        validation_report = validate_dataframe(df)

        return jsonify({
            "id": f"upload_{int(datetime.now().timestamp())}",
            "name": dataset_name,
            "description": description,
            "source_type": "CSV Upload",
            "collected_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "columns": payload["columns"],
            "rows": payload["rows"],
            "total_rows": payload["total_rows"],
            "total_columns": payload["total_columns"],
            "validation": validation_report
        })

    except Exception as e:
        logger.error(f"Error handling upload: {e}")
        return jsonify({"error": f"Failed to process file: {str(e)}"}), 500

@app.route('/api/manual', methods=['POST'])
def manual_dataset_entry():
    """Receives manually entered records and returns a validated dataset."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON payload."}), 400

    name = data.get("name", "Manual Dataset").strip() or "Manual Dataset"
    description = data.get("description", "Manually entered dataset").strip()
    columns = data.get("columns", [])
    rows = data.get("rows", [])

    if not columns:
        return jsonify({"error": "Dataset must contain at least one column."}), 400
    if not rows or len(rows) == 0:
        return jsonify({"error": "Dataset must contain at least one row."}), 400

    try:
        df = payload_to_df(columns, rows)
        payload = df_to_payload(df)
        validation_report = validate_dataframe(df)

        return jsonify({
            "id": f"manual_{int(datetime.now().timestamp())}",
            "name": name,
            "description": description,
            "source_type": "Manual Entry",
            "collected_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "columns": payload["columns"],
            "rows": payload["rows"],
            "total_rows": payload["total_rows"],
            "total_columns": payload["total_columns"],
            "validation": validation_report
        })
    except Exception as e:
        logger.error(f"Error creating manual dataset: {e}")
        return jsonify({"error": f"Failed to process manual data: {str(e)}"}), 500

@app.route('/api/validate', methods=['POST'])
def validate_dataset_endpoint():
    """Validates submitted dataset columns and rows."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Missing payload."}), 400

    columns = data.get("columns", [])
    rows = data.get("rows", [])

    if not columns or not rows:
        return jsonify({"error": "Empty dataset provided."}), 400

    try:
        df = payload_to_df(columns, rows)
        report = validate_dataframe(df)
        return jsonify({"validation": report})
    except Exception as e:
        return jsonify({"error": f"Validation failed: {str(e)}"}), 500

@app.route('/api/clean', methods=['POST'])
def clean_dataset_endpoint():
    """Performs data cleaning operations based on user parameters."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Missing payload."}), 400

    columns = data.get("columns", [])
    rows = data.get("rows", [])
    rules = data.get("rules", {})

    if not columns or not rows:
        return jsonify({"error": "Cannot clean an empty dataset."}), 400

    try:
        df = payload_to_df(columns, rows)
        cleaned_df, summary = clean_dataframe(df, rules)

        payload = df_to_payload(cleaned_df)
        new_validation = validate_dataframe(cleaned_df)

        return jsonify({
            "cleaned_columns": payload["columns"],
            "cleaned_rows": payload["rows"],
            "total_rows": payload["total_rows"],
            "total_columns": payload["total_columns"],
            "summary": summary,
            "validation": new_validation
        })
    except Exception as e:
        logger.error(f"Error during dataset cleaning: {e}")
        return jsonify({"error": f"Cleaning operation failed: {str(e)}"}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_dataset_endpoint():
    """Runs statistical profiling, distributions, and correlations."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Missing payload."}), 400

    columns = data.get("columns", [])
    rows = data.get("rows", [])

    if not columns or not rows:
        return jsonify({"error": "Cannot analyze an empty dataset."}), 400

    try:
        df = payload_to_df(columns, rows)
        analysis_report = analyze_dataframe(df)
        return jsonify({"analysis": analysis_report})
    except Exception as e:
        logger.error(f"Error during dataset analysis: {e}")
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

@app.route('/api/export/csv', methods=['POST'])
def export_csv():
    """Exports dataset records as a downloadable CSV file."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Missing payload."}), 400

    columns = data.get("columns", [])
    rows = data.get("rows", [])
    filename = data.get("filename", "dataset.csv")
    if not filename.endswith('.csv'):
        filename += '.csv'

    try:
        df = payload_to_df(columns, rows)
        output = io.StringIO()
        df.to_csv(output, index=False)
        csv_content = output.getvalue()

        return Response(
            csv_content,
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        return jsonify({"error": f"CSV export failed: {str(e)}"}), 500

@app.route('/api/export/json', methods=['POST'])
def export_json():
    """Exports dataset summary, validation, and metadata as a downloadable JSON report."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Missing payload."}), 400

    filename = data.get("filename", "dataset_summary.json")
    if not filename.endswith('.json'):
        filename += '.json'

    try:
        json_str = json.dumps(data.get("content", {}), indent=2)
        return Response(
            json_str,
            mimetype="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        return jsonify({"error": f"JSON export failed: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Data Collection for ML API running on http://127.0.0.1:{port}")
    app.run(host='127.0.0.1', port=port, debug=False)
