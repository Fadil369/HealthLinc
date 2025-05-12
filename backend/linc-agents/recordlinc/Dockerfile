FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better layer caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3002

# Set environment variables
ENV PORT=3002 \
    PYTHONUNBUFFERED=1 \
    FHIR_SERVER_URL=http://fhir-gateway:8000/fhir \
    AUTH_SERVICE_URL=http://authlinc:3003

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3002"]
