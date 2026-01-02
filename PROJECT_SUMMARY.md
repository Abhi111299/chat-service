# Project Summary - Secure Chat API

##  Completed Deliverables

### 1. Architecture & Environment 
-  Express app with dotenv, CORS, helmet, compression, express-rate-limit
-  MySQL via Sequelize ORM
-  Docker Compose setup (app + MySQL)
-  Global error handler
-  Request logging with morgan

### 2. Authentication & Authorization 
-  Registration with unique email constraint
-  Login with access + refresh tokens
-  Refresh token rotation on refresh
-  Logout endpoint (invalidates refresh token)
-  Role-based access control middleware (user/admin)
-  Input validation with Zod

### 3. Chat Modules 
-  Models: User, Conversation, Message
-  Endpoints:
  -  `/api/auth/register`
  -  `/api/auth/login`
  -  `/api/auth/refresh`
  -  `/api/auth/logout`
  -  `/api/users` (secured, paginated)
  -  `/api/conversations` (create/retrieve)
  -  `/api/messages` (create)
  -  `/api/conversations/:id/messages` (paginated, newest-last)
-  Message metadata (timestamps, senderId)

### 4. Real-Time Features 
-  Socket.IO integration
-  Events: `message:new`, `message:seen`, `typing:start`, `typing:stop`
-  Room-based messaging per conversation ID
-  JWT authentication for Socket.IO connections

### 5. Profile Picture Management 
-  Local storage with Multer
-  Multiple image uploads per user (2-5MB, JPEG/PNG only)
-  Database table: `UserProfileImage`
-  Endpoints:
  -  `POST /api/users/:id/profile-pictures` (multi-upload)
  -  `PATCH /api/users/:id/profile-pictures/:pictureId/default`
  -  `DELETE /api/users/:id/profile-pictures/:pictureId`
-  Application-level enforcement: only one default per user

### 6. Performance & Reliability 
-  Indexes on `Message(conversationId, createdAt)`
-  Indexes on `Conversation(userAId, userBId)`
-  Cursor-based pagination
-  Database seeders for users and sample messages

### 7. Documentation & Tests 
-  Swagger/OpenAPI documentation at `/api-docs`
-  Postman collection (`postman_collection.json`)
-  Jest + Supertest tests for key routes
-  Comprehensive README with setup instructions
-  Presentation deck (5-7 slides) in `presentation.md`

## Project Structure

```
chat/
 config/              # Database configuration
 controllers/         # Business logic
 middleware/          # Auth, validation, error handling, upload
 models/             # Sequelize models
 routes/             # API routes
 scripts/            # Migration and seed scripts
 socket/             # Socket.IO handlers
 tests/              # Jest test files
 utils/              # JWT and validation utilities
 server.js           # Main application entry
 docker-compose.yml  # Docker setup
 Dockerfile          # Node.js container with cache optimization
 package.json        # Dependencies and scripts
 README.md           # Comprehensive documentation
 SETUP.md            # Quick setup guide
 presentation.md     # Architecture & security slides
 
```

## Key Features

### Security
- JWT authentication with refresh token rotation
- Password hashing with bcrypt (10 rounds)
- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes)
- Input validation with Zod schemas
- SQL injection protection via Sequelize ORM
- File upload validation (type and size)

### Performance
- Database indexes on frequently queried fields
- Cursor-based pagination for efficient data retrieval
- Connection pooling
- Compression middleware
- Optimized Docker image with node cache

### Real-Time
- Socket.IO for instant messaging
- Room-based conversation management
- Typing indicators
- Read receipts
- Authenticated WebSocket connections

## Environment Variables

Create a `.env` file based on `.env.sh`:

```env
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=chat_db
DB_USER=root
DB_PASSWORD=12345678
JWT_SECRET=jshdfvwEUFHSBFUWEFBWEFWEUFWEFFBWE
JWT_REFRESH_SECRET=jshdfvwEUFHSBFUWEFBWEFWEUFWEFFBWE
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
UPLOAD_DIR=./uploads/profile-pictures
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Quick Start

```bash
# With Docker
docker-compose up -d
docker-compose exec app npm run db:migrate
docker-compose exec app npm run db:seed

# Manual
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Testing

```bash
npm test              # Run tests
npm test -- --coverage  # With coverage
npm run test:watch    # Watch mode
```

## API Documentation

- Swagger UI: http://localhost:4000/api-docs
- Health Check: http://localhost:4000/health

## Notes

- MySQL doesn't support partial unique indexes with WHERE clauses, so the "one default per user" constraint is enforced at the application level in the `setDefaultProfilePicture` controller
- All file uploads are stored locally in `./uploads/profile-pictures`
- Refresh tokens are stored in the database and invalidated on logout
- Socket.IO connections require JWT authentication via handshake

## Next Steps

1. Set up production environment variables
2. Configure production database
3. Set up file storage (consider cloud storage for production)
4. Add monitoring and logging
5. Set up CI/CD pipeline
6. Add more comprehensive test coverage

