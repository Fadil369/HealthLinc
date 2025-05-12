FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build Next.js application for production
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Run the application
CMD ["npm", "start"]
