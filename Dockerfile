# Stage 1: Build Frontend
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve with Node.js
FROM node:20-alpine

WORKDIR /app

# Copy package files for production install (express, etc)
COPY package.json package-lock.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy built assets from builder stage
COPY --from=build /app/dist /app/dist

# Copy server code
COPY server.js /app/server.js

EXPOSE 3000

# Start Node server
CMD ["node", "server.js"]
