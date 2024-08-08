import os
import time
import json
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
                result = process(*args, **kwargs)
                task_completed = True
                yield f"data: {json.dumps(result)}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                task_completed = True

            yield 'data: {"status": "processing"}\n\n'
            time.sleep(25)

    return Response(generate(), content_type='text/event-stream')

@app.route('/submit-data', methods=['POST'])
@cross_origin()
def submit_data():
    data = request.get_json()
    if data:
        return stream_with_heartbeat(long_process, data)
    else:
        return jsonify({"error": "No data provided"}), 400

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