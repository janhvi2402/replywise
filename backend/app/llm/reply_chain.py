import os
from langchain_cohere import ChatCohere
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda

prompt = ChatPromptTemplate.from_messages([
    ("system",
     "You write email replies on behalf of the user, whose name is: {my_name}. "
     "Write only the reply body (no subject line). Start with a greeting that uses "
     "the first name of the person who wrote the email, if it is clear. Be polite "
     "and concise. Do not invent facts, dates, or commitments; if the email needs "
     "information you don't have, say you'll follow up. Tone: {tone}. "
     "End with a short closing such as 'Best regards,' followed by the user's name "
     "on its own line. If the user's name is blank, end with the closing only. "
     "Never write placeholders such as [Your Name]."),
    ("human",
     "From: {sender}\nSubject: {subject}\n\n{body}\n\nWrite a reply."),
])


def _prepare(inputs: dict) -> dict:
    body = (inputs.get("body") or "").strip()
    return {
        "sender": inputs.get("sender", ""),
        "subject": inputs.get("subject", ""),
        "body": body[:6000] or "(The email body was empty or could not be read.)",
        "tone": inputs.get("tone", "professional"),
        "my_name": inputs.get("my_name") or "(blank)",
    }


def build_reply_chain():
    llm = ChatCohere(model=os.getenv("COHERE_MODEL", "command-a-03-2025"), temperature=0.3)
    return RunnableLambda(_prepare) | prompt | llm | StrOutputParser()


def generate_reply(sender, subject, body, tone="professional", my_name=""):
    chain = build_reply_chain()
    return chain.invoke({
        "sender": sender, "subject": subject, "body": body,
        "tone": tone, "my_name": my_name,
    })