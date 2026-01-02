FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with node cache optimization
# Install all dependencies (including dev) for development
RUN npm ci --cache /tmp/.npm && \
    npm cache clean --force && \
    rm -rf /tmp/.npm

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/profile-pictures

EXPOSE 4000

CMD ["npm", "start"]

