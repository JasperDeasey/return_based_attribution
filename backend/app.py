import os
import time
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS, cross_origin
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import backend.analysis

load_dotenv()

app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
CORS(app)

uri = os.getenv("DATABASE_URL")
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://")

app.config['SQLALCHEMY_DATABASE_URI'] = uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

def long_process(data):
    return backend.analysis.process_data(data)

def stream_with_heartbeat(process, *args, **kwargs):
    def generate():
        task_completed = False
        while not task_completed:
            try:
                # Process the task
                result = process(*args, **kwargs)
                task_completed = True
                yield f"data: {json.dumps(result)}\n\n"
            except Exception as e:
                # Handle the exception (optional)
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                task_completed = True

            # Send a heartbeat to keep the connection alive
            time.sleep(25)
            yield 'data: {"status": "processing"}\n\n'

    return Response(generate(), content_type='text/event-stream')

@app.route('/submit-data', methods=['POST'])
@cross_origin()
def submit_data():
    data = request.get_json()
    if data:
        return stream_with_heartbeat(long_process, data)
    else:
        return jsonify({"error": "No data provided"}), 400

@app.route('/')
@cross_origin()
def serve():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)