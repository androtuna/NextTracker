# Stage 1: Build React App
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and build the React frontend
COPY . .
RUN npm run build

# Stage 2: Runtime Node.js Server
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy built frontend assets from builder stage
COPY --from=build /app/dist ./dist

# Copy the server file and other necessary files
COPY server.js .
COPY .env* ./

# NextTracker runs on port 3000 by default (check server.js)
EXPOSE 3000

# Start the Node.js server
CMD ["node", "server.js"]
