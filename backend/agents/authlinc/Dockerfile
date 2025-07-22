FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better layer caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3003

# Set environment variables
ENV PORT=3003 \
    PYTHONUNBUFFERED=1 \
    JWT_SECRET=healthlinc-docker-dev-key-change-in-production \
    ACCESS_TOKEN_EXPIRE_MINUTES=60 \
    REFRESH_TOKEN_EXPIRE_DAYS=7

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3003"]
