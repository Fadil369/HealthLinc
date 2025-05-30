FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better layer caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3004

# Set environment variables
ENV PORT=3004 \
    PYTHONUNBUFFERED=1 \
    SMTP_SERVER="smtp.gmail.com" \
    SMTP_PORT=587 \
    SMTP_USERNAME="noreply@healthlinc.app" \
    SMTP_PASSWORD="change-in-production" \
    DEFAULT_SENDER="HealthLinc <noreply@healthlinc.app>"

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3004"]
