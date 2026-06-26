FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY engine.py .
COPY main.py .

ENV COST_ENGINE_PORT=8084
ENV CORS_ORIGIN=http://localhost:3000

EXPOSE 8084

CMD ["python", "main.py"]
