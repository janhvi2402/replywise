import os

# Allow HTTP only for local development
if not os.getenv("BACKEND_URL", "").startswith("https://"):
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"

import requests
from dotenv import load_dotenv
from flask import Blueprint, redirect, session, request, current_app
from google_auth_oauthlib.flow import Flow

load_dotenv()  # make sure .env is loaded before the values below are read

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:5173")


def build_flow(state=None):
    redirect_uri = os.getenv("BACKEND_URL") + "/auth/callback"
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri],
            }
        },
        scopes=SCOPES,
        state=state,
        autogenerate_code_verifier=False,
    )
    flow.redirect_uri = redirect_uri
    return flow


def fetch_user_profile(access_token):
    """Name and email of the Google account that just signed in."""
    try:
        r = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        return {"name": data.get("name", ""), "email": data.get("email", "")}
    except Exception:
        current_app.logger.exception("Could not fetch Google profile")
        return {}


@auth_bp.route("/login")
def login():
    if session.get("credentials"):
        return redirect(FRONTEND_URL)

    flow = build_flow()
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    session["state"] = state
    return redirect(authorization_url)


@auth_bp.route("/callback")
def callback():
    state = session.get("state")

    if not state:
        # Session cookie missing: host mismatch, reused callback URL, or no secret key
        return redirect(f"{FRONTEND_URL}/?login=failed")

    flow = build_flow(state=state)

    try:
        flow.fetch_token(authorization_response=request.url)
    except Exception:
        current_app.logger.exception("OAuth token exchange failed")
        session.pop("state", None)
        return redirect(f"{FRONTEND_URL}/?login=failed")

    credentials = flow.credentials

    session["credentials"] = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": credentials.scopes,
    }
    session["user"] = fetch_user_profile(credentials.token)
    session.pop("state", None)

    return redirect(FRONTEND_URL)


@auth_bp.route("/me")
def me():
    user = session.get("user") or {}
    return {
        "authenticated": bool(session.get("credentials")),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
    }


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return {"status": "logged_out"}