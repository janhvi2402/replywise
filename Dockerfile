# ---------- Stage 1: build the React frontend ----------
FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: Flask backend + built frontend ----------
FROM python:3.14-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend /frontend/dist ./static_frontend

CMD ["sh", "-c", "gunicorn run:app --bind 0.0.0.0:${PORT:-10000} --workers 1 --threads 4 --timeout 120"]
