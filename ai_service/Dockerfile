FROM python:3.9-slim

# Prevent Python from writing pyc files and buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Upgrade pip first (important for wheel compatibility)
RUN pip install --no-cache-dir --upgrade pip

# Copy requirements and install Python dependencies ONLY
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Ensure models directory exists
RUN mkdir -p models

EXPOSE 5001

CMD ["python", "main.py"]
