# Stage 1: Build the React application
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Install 'serve' globally to serve static files
RUN npm install -g serve

# Copy built assets from the builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start the application
# The -s flag rewrites all not-found requests to index.html (perfect for SPA routing)
CMD ["serve", "-s", "dist", "-l", "3000"]
