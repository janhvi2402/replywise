from flask import Blueprint, request, Response
from app.services.gmail_service import get_gmail_service, list_emails, get_email, send_reply
from app.llm.reply_chain import generate_reply
from app.services.reply_service import reply_to_email

email_bp = Blueprint("email", __name__, url_prefix="/emails")

NOT_LOGGED_IN = ({"error": "Not authenticated. Visit /auth/login first."}, 401)


@email_bp.route("/")
def inbox():
    service = get_gmail_service()
    if not service:
        return NOT_LOGGED_IN
    return {"emails": list_emails(service)}


@email_bp.route("/<msg_id>/draft")
def draft(msg_id):
    service = get_gmail_service()
    if not service:
        return NOT_LOGGED_IN
    email = get_email(service, msg_id)
    tone = request.args.get("tone", "professional")
    reply = generate_reply(email["from"], email["subject"], email["body"], tone)
    return {"to": email["reply_to"], "subject": email["subject"], "draft": reply}


@email_bp.route("/<msg_id>/send", methods=["POST"])
def send(msg_id):
    service = get_gmail_service()
    if not service:
        return NOT_LOGGED_IN
    reply_text = (request.get_json(silent=True) or {}).get("reply", "").strip()
    if not reply_text:
        return {"error": "Missing 'reply' text"}, 400
    email = get_email(service, msg_id)
    sent = send_reply(service, email, reply_text)
    return {"status": "sent", "id": sent["id"]}


@email_bp.route("/<msg_id>/reply", methods=["POST"])
def reply(msg_id):
    service = get_gmail_service()
    if not service:
        return NOT_LOGGED_IN
    body = request.get_json(silent=True) or {}
    return reply_to_email(
        service, msg_id,
        tone=body.get("tone", "professional"),
        send=bool(body.get("send", False)),
        edited_reply=body.get("reply"),
    )
@email_bp.route("/<msg_id>")
def read_email(msg_id):
    service = get_gmail_service()
    if not service:
        return NOT_LOGGED_IN
    email = get_email(service, msg_id)
    return {
        "id": email["id"],
        "from": email["from"],
        "to": email["to"],
        "subject": email["subject"],
        "date": email["date"],
        "body": email["body"][:20000],   # keep very long newsletters manageable
    }