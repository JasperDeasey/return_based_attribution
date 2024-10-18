# backend/app.py

import os
import sys
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.WARNING)

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the Celery app and task
from celery_app import celery
from analysis.tasks import process_data

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
CORS(app)  # Enable CORS

# Route to accept data and enqueue a background task
@app.route('/submit-data', methods=['POST'])
def submit_data():
    data = request.get_json()
    logging.info(f"Received data: {data}")
    if data:
        try:
            # Enqueue the task using Celery
            task = process_data.apply_async(args=[data])
            logging.info(f"Enqueued task: {task.id}")
            return jsonify({'task_id': task.id}), 202  # Return 202 Accepted
        except Exception as e:
            logging.error(f"Failed to enqueue task: {e}", exc_info=True)
            return jsonify({"error": "Failed to enqueue task"}), 500
    else:
        logging.error("No data provided in request")
        return jsonify({"error": "No data provided"}), 400

# Route to check the status of a task
@app.route('/task-status/<task_id>', methods=['GET'])
def task_status(task_id):
    task = process_data.AsyncResult(task_id)
    if task.state == 'PENDING':
        # Task has not started yet
        response = {'status': 'pending'}
    elif task.state == 'SUCCESS':
        # Task completed successfully
        response = {'status': 'completed', 'result': task.result}
    elif task.state == 'FAILURE':
        # Task failed
        response = {'status': 'error', 'error': str(task.info)}
    else:
        # Task is in progress
        response = {'status': task.state}
    return jsonify(response)

# Run Flask app
if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
