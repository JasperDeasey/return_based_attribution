import json
from flask import request, jsonify
import api.analysis as analysis
import os

def configure_routes(app):

    @app.route('/submit-data', methods=['POST'])
    def submit_data():
        data = request.get_json()  # Extract JSON data from the request
        processed_data = process_data(data)  # Process the data
        return jsonify(processed_data)  # Return the processed data

    def process_data(data):
        # Example data processing: append " processed" to each value
        if data:
            data = analysis.process_data(data)
            return data
        return {"error": "No data received"}