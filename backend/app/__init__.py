from flask import Flask, redirect
from flask_cors import CORS
from dotenv import load_dotenv
import os

from app.routes.auth_routes import auth_bp
from app.routes.email_routes import email_bp

load_dotenv()


def create_app():
    app = Flask(__name__)

    app.secret_key = os.getenv("FLASK_SECRET_KEY")

    CORS(app, origins=[os.getenv("FRONTEND_URL")], supports_credentials=True)

    app.register_blueprint(auth_bp)
    app.register_blueprint(email_bp)

    @app.route("/")
    def index():
        return redirect("/auth/login")

    @app.route("/api/health")
    def health():
        return {"status": "Backend running"}

    return app
