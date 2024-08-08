import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS, cross_origin
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import api.analysis

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

db = SQLAlchemy(app)

# Example of route configuration
# Remove if you don't have these functions defined
# def configure_routes(app):
#     @app.route('/api/example')
#     def example():
#         return jsonify({"message": "Example route"})

# Configure routes
# configure_routes(app)

# Example data processing function
def process_data(data):
    # Add your data processing logic here
    return {"processed_data": data}

@app.route('/submit-data', methods=['POST'])
@cross_origin()
def submit_data():
    data = request.get_json() 
    if data:
        processed_data = api.analysis.process_data(data)  # Process the data
        return jsonify(processed_data)  # Return the processed data
    else:
        return jsonify({"error": "No data provided"}), 400

@app.route('/')
@cross_origin()
def serve():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)