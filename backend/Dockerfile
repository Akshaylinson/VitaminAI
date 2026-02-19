FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
RUN mkdir -p data/uploads data/database

EXPOSE 5000
CMD ["python", "app/main.py"]