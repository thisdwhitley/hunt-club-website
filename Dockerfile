FROM node:20-alpine

# Install git for development
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Ensure zod is explicitly installed
RUN npm list zod || npm install zod@^3.25.71

# Copy source code
COPY . .

# Expose development port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
