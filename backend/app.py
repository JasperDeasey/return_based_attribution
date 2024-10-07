# app.py

import os
import sys

# Set the environment variable before any other imports
os.environ['OBJC_DISABLE_INITIALIZE_FORK_SAFETY'] = 'YES'

from flask import Flask, request, jsonify
from dotenv import load_dotenv
import redis
from rq import Queue
from flask_cors import CORS
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the process_data function directly
from analysis.analysis_main import process_data

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS

# Redis connection (Heroku sets REDIS_URL; default to localhost for development)
try:
    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
    conn = redis.from_url(redis_url)
except Exception as e:
    logging.error(f"Error connecting to Redis: {e}")
    sys.exit(1)

# Initialize RQ queue
q = Queue(connection=conn)

# Route to accept data and enqueue a background task
@app.route('/submit-data', methods=['POST'])
def submit_data():
    data = request.get_json()
    logging.info(f"Received data: {data}")
    if data:
        try:
            # Enqueue the task using enqueue_call to specify job options explicitly
            job = q.enqueue_call(
                func=process_data,
                args=(data,),    # Positional arguments for process_data
                kwargs={},       # Keyword arguments for process_data
                timeout=600      # Job option
            )
            logging.info(f"Enqueued job: {job.get_id()}")
            return jsonify({'task_id': job.get_id()}), 202  # Return 202 Accepted
        except Exception as e:
            logging.error(f"Failed to enqueue job: {e}", exc_info=True)
            return jsonify({"error": "Failed to enqueue job"}), 500
    else:
        logging.error("No data provided in request")
        return jsonify({"error": "No data provided"}), 400

# Route to check the status of a task
@app.route('/task-status/<task_id>', methods=['GET'])
def task_status(task_id):
    job = q.fetch_job(task_id)
    if job:
        if job.is_finished:
            return jsonify({'status': 'completed', 'result': job.result})
        elif job.is_failed:
            return jsonify({'status': 'error', 'error': str(job.exc_info)})
        else:
            return jsonify({'status': 'processing'})
    else:
        return jsonify({'error': 'Task not found. Ensure the job ID is correct or check if the Redis server is running.'}), 404

# Run Flask app
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
