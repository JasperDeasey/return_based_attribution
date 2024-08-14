import os
import time
import json
from uuid import uuid4
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS, cross_origin
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import analysis.analysis

load_dotenv()

app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
CORS(app)

uri = os.getenv("DATABASE_URL")
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://")

app.config['SQLALCHEMY_DATABASE_URI'] = uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

tasks = {}

def long_process(data):
    return backend.analysis.process_data(data)

@app.route('/submit-data', methods=['POST'])
@cross_origin()
def submit_data():
    data = request.get_json()
    if data:
        task_id = str(uuid4())
        tasks[task_id] = {
            'status': 'processing',
            'result': None
        }
        # Simulate background processing
        def background_task(task_id, data):
            try:
                result = long_process(data)
                tasks[task_id]['result'] = result
                tasks[task_id]['status'] = 'completed'
            except Exception as e:
                tasks[task_id]['result'] = {'error': str(e)}
                tasks[task_id]['status'] = 'error'
        
        from threading import Thread
        thread = Thread(target=background_task, args=(task_id, data))
        thread.start()

        return jsonify({'task_id': task_id})
    else:
        return jsonify({"error": "No data provided"}), 400

@app.route('/task-status/<task_id>', methods=['GET'])
@cross_origin()
def task_status(task_id):
    task = tasks.get(task_id)
    if task:
        return jsonify(task)
    else:
        return jsonify({'error': 'Task not found'}), 404

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
@cross_origin()
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)