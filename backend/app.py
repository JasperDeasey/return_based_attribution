import os
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from api.routes import configure_routes

load_dotenv()  # Load environment variables from .env file

def create_app():
    app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
    CORS(app)  # Enable CORS for all routes and origins

    # Get the database URL from the environment variable
    uri = os.getenv("DATABASE_URL")
    if uri and uri.startswith("postgres://"):
        uri = uri.replace("postgres://", "postgresql://")

    # Set the SQLAlchemy database URI
    app.config['SQLALCHEMY_DATABASE_URI'] = uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db = SQLAlchemy(app)
    
    configure_routes(app)

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)