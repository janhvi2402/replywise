import base64
from email.mime.text import MIMEText
from flask import session
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import os

def get_gmail_service():
    data = session.get("credentials")
    if not data:
        return None
    return build("gmail", "v1", credentials=Credentials(**data))


def _header(headers, name):
    for h in headers:
        if h["name"].lower() == name.lower():
            return h["value"]
    return ""


def _extract_body(payload):
    if payload.get("mimeType") == "text/plain" and payload.get("body", {}).get("data"):
        return base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="ignore")
    for part in payload.get("parts", []) or []:
        text = _extract_body(part)
        if text:
            return text
    return ""


def list_emails(service, max_results=10):
    res = service.users().messages().list(
        userId="me", labelIds=["INBOX"], maxResults=max_results
    ).execute()
    emails = []
    for m in res.get("messages", []):
        msg = service.users().messages().get(
            userId="me", id=m["id"], format="metadata",
            metadataHeaders=["From", "Subject"],
        ).execute()
        h = msg["payload"]["headers"]
        emails.append({
            "id": msg["id"],
            "from": _header(h, "From"),
            "subject": _header(h, "Subject"),
            "snippet": msg.get("snippet", ""),
        })
    return emails


def get_email(service, msg_id):
    msg = service.users().messages().get(userId="me", id=msg_id, format="full").execute()
    h = msg["payload"]["headers"]
    return {
        "id": msg["id"],
        "thread_id": msg["threadId"],
        "from": _header(h, "From"),
        "reply_to": _header(h, "Reply-To") or _header(h, "From"),
        "subject": _header(h, "Subject"),
        "message_id": _header(h, "Message-ID"),
        "body": _extract_body(msg["payload"]),
    }


def send_reply(service, email, reply_text):
    mime = MIMEText(reply_text)
    mime["to"] = email["reply_to"]
    subject = email["subject"]
    mime["subject"] = subject if subject.lower().startswith("re:") else f"Re: {subject}"
    if email["message_id"]:
        mime["In-Reply-To"] = email["message_id"]
        mime["References"] = email["message_id"]

    raw = base64.urlsafe_b64encode(mime.as_bytes()).decode()
    return service.users().messages().send(
        userId="me", body={"raw": raw, "threadId": email["thread_id"]}
    ).execute()

def get_sender_name(service):
    """Your display name from Gmail 'Send mail as' settings."""
    try:
        res = service.users().settings().sendAs().list(userId="me").execute()
        aliases = res.get("sendAs", [])
        for a in aliases:                       # primary address first
            if a.get("isPrimary") and a.get("displayName"):
                return a["displayName"]
        for a in aliases:                       # then any alias with a name
            if a.get("displayName"):
                return a["displayName"]
    except Exception:
        pass
    return os.getenv("SENDER_NAME", "")         # fallback from .env