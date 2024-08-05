from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # This will enable CORS for all domains and routes

@app.route('/submit-data', methods=['POST'])
def submit_data():
    # Extract JSON data from the request
    data = request.get_json()

    # Mock processing - for now, let's just modify the data a bit
    if data:
        processed_data = {key: val + " processed" for key, val in data.items()}
    else:
        processed_data = {"error": "No data received"}

    # Send the processed data back as JSON
    return jsonify(processed_data)

if __name__ == "__main__":
    app.run(debug=True, port=5000)  # Run the Flask app with debug mode on port 5000