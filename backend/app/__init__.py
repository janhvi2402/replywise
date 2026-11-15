from flask import Flask, redirect, send_from_directory
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from dotenv import load_dotenv
import os

from app.routes.auth_routes import auth_bp
from app.routes.email_routes import email_bp

load_dotenv()

STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static_frontend")


def create_app():
    app = Flask(__name__)
    app.secret_key = os.getenv("FLASK_SECRET_KEY")

    is_prod = os.getenv("BACKEND_URL", "").startswith("https://")
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=is_prod,
    )
    if is_prod:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    CORS(app, origins=[os.getenv("FRONTEND_URL")])

    app.register_blueprint(auth_bp)
    app.register_blueprint(email_bp)

    @app.route("/api/health")
    def health():
        return {"status": "Backend running"}

    # Serve the built React app (production); fall back to login when running locally
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def frontend(path):
        if path and os.path.isfile(os.path.join(STATIC_DIR, path)):
            return send_from_directory(STATIC_DIR, path)
        if os.path.isfile(os.path.join(STATIC_DIR, "index.html")):
            return send_from_directory(STATIC_DIR, "index.html")
        return redirect("/auth/login")

    return app