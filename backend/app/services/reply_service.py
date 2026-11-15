import os
from flask import session
from app.services.gmail_service import get_email, send_reply
from app.llm.reply_chain import generate_reply


def _my_name():
    user = session.get("user") or {}
    return user.get("name") or os.getenv("SENDER_NAME", "")


def reply_to_email(service, msg_id, tone="professional", send=False, edited_reply=None):
    email = get_email(service, msg_id)
    reply = edited_reply or generate_reply(
        email["from"], email["subject"], email["body"], tone,
        my_name=_my_name(),
    )
    if send:
        sent = send_reply(service, email, reply)
        return {"status": "sent", "id": sent["id"], "to": email["reply_to"], "reply": reply}
    return {"status": "draft", "to": email["reply_to"], "subject": email["subject"], "reply": reply}