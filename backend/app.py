from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from routes import configure_routes
import os

load_dotenv()  # Load environment variables from .env file

def create_app():
    app = Flask(__name__, static_folder='../frontend/build')
    CORS(app)  # Enable CORS for all routes and origins
    
    configure_routes(app)

    @app.route('/')
    def serve():
        return send_from_directory(app.static_folder, 'index.html')

    @app.route('/<path:path>')
    def serve_static(path):
        return send_from_directory(app.static_folder, path)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)