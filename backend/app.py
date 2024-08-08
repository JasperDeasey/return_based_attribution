import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS, cross_origin
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import backend.analysis
from celery import Celery

load_dotenv()

app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
CORS(app)

# Get the database URL from the environment variable
uri = os.getenv("DATABASE_URL")
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://")

# Set the SQLAlchemy database URI
app.config['SQLALCHEMY_DATABASE_URI'] = uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['CELERY_BROKER_URL'] = os.getenv('REDIS_URL')
app.config['CELERY_RESULT_BACKEND'] = os.getenv('REDIS_URL')

db = SQLAlchemy(app)
celery = make_celery(app)

@celery.task
def process_data_task(data):
    return backend.analysis.process_data(data)

@app.route('/submit-data', methods=['POST'])
@cross_origin()
def submit_data():
    data = request.get_json()
    if data:
        task = process_data_task.delay(data)  # Run the task asynchronously
        return jsonify({"task_id": task.id}), 202
    else:
        return jsonify({"error": "No data provided"}), 400

@app.route('/task-status/<task_id>', methods=['GET'])
@cross_origin()
def task_status(task_id):
    task = process_data_task.AsyncResult(task_id)
    if task.state == 'PENDING':
        response = {
            'state': task.state,
            'status': 'Pending...'
        }
    elif task.state != 'FAILURE':
        response = {
            'state': task.state,
            'status': task.state,
            'result': task.result
        }
    else:
        response = {
            'state': task.state,
            'status': str(task.info)
        }
    return jsonify(response)

@app.route('/')
@cross_origin()
def serve():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)