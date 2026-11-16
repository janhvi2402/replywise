from flask import Blueprint, request, current_app
from app.extensions import limiter
from app.llm.reply_chain import generate_reply

demo_bp = Blueprint("demo", __name__, url_prefix="/demo")

TONES = {"professional", "friendly", "concise", "formal"}


@demo_bp.app_errorhandler(429)
def too_many_requests(_error):
    return {
        "error": "Demo limit reached for today. Please try again tomorrow."
    }, 429


@demo_bp.route("/reply", methods=["POST"])
@limiter.limit("10 per day")
@limiter.limit("200 per day", key_func=lambda: "global")
def demo_reply():
    data = request.get_json(silent=True) or {}
    body = (data.get("body") or "").strip()
    if len(body) < 10:
        return {"error": "Please paste an email first (at least a sentence)."}, 400

    tone = data.get("tone") if data.get("tone") in TONES else "professional"
    try:
        reply = generate_reply(
            (data.get("sender") or "")[:200],
            (data.get("subject") or "")[:200],
            body[:4000],
            tone,
            my_name=(data.get("name") or "")[:60],
        )
    except Exception:
        current_app.logger.exception("Demo reply failed")
        return {"error": "The AI service is busy. Please try again in a moment."}, 502

    return {"reply": reply}