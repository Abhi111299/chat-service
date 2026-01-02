# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=chat_db
DB_USER=root
DB_PASSWORD=12345678

# JWT Configuration
JWT_SECRET=jshdfvwEUFHSBFUWEFBWEFWEUFWEFFBWE
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=SECRETKEYSECRETKEYSECRETKEY
JWT_REFRESH_EXPIRY=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:4000,http://localhost:4001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
UPLOAD_DIR=./uploads/profile-pictures
ALLOWED_FILE_TYPES=image/jpeg,image/png
MAX_FILE_SIZE=5242880

