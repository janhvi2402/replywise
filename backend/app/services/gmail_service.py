import base64
from email.mime.text import MIMEText
from flask import session
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import os
import re
from html.parser import HTMLParser

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


class _HTMLText(HTMLParser):
    BLOCK = {"p", "div", "tr", "li", "h1", "h2", "h3", "h4", "h5", "h6", "table", "ul", "ol"}
    SKIP = {"script", "style", "head"}

    def __init__(self):
        super().__init__()
        self.parts = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self._skip += 1
        elif tag == "br" or tag in self.BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in self.SKIP:
            self._skip = max(0, self._skip - 1)
        elif tag in self.BLOCK:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self._skip:
            self.parts.append(data)


def html_to_text(html):
    parser = _HTMLText()
    parser.feed(html)
    parser.close()
    text = "".join(parser.parts)
    text = re.sub(r"[ \t\xa0]+", " ", text)
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    return text.strip()


def _decode(data):
    data += "=" * (-len(data) % 4)   # Gmail omits base64 padding
    return base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")


def _find_part(payload, mime):
    if payload.get("mimeType") == mime and payload.get("body", {}).get("data"):
        return _decode(payload["body"]["data"])
    for part in payload.get("parts", []) or []:
        found = _find_part(part, mime)
        if found:
            return found
    return ""


def _extract_body(payload):
    text = _find_part(payload, "text/plain")
    if text.strip():
        return text.strip()
    html = _find_part(payload, "text/html")
    return html_to_text(html) if html else ""


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
        "to": _header(h, "To"),
        "date": _header(h, "Date"),
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