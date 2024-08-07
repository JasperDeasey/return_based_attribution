from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)  # Enable Cross-Origin Resource Sharing (CORS) if needed

    from ..routes import main_bp
    app.register_blueprint(main_bp)

    return app
