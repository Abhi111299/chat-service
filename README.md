# Secure Chat API

A secure, scalable, real-time chat backend built with Node.js, Express, MySQL, Sequelize, and Socket.IO. Features JWT authentication with refresh token rotation, role-based authorization, real-time messaging, and profile picture management.

## Features

- 🔐 **JWT Authentication** - Access and refresh tokens with automatic rotation
- 👥 **Role-Based Access Control** - User and admin roles
- 💬 **Real-Time Messaging** - Socket.IO for instant message delivery
- 📸 **Profile Picture Management** - Multiple images per user with default selection
- 📊 **Pagination** - Efficient cursor-based pagination
- 🛡️ **Security** - Helmet, CORS, rate limiting, input validation
- 📚 **API Documentation** - Swagger/OpenAPI integration
- 🧪 **Testing** - Jest test suite with Supertest

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **ORM**: Sequelize
- **Real-Time**: Socket.IO
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (recommended)
- MySQL 8.0 (if not using Docker)

## Installation

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd chat
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration (optional, defaults work for Docker)

4. Start services:
```bash
docker-compose up -d
```

The API will be available at `http://localhost:4000`

### Manual Installation

1. Install dependencies:
```bash
npm install
```

2. Set up MySQL database:
```bash
# Create database
mysql -u root -p
CREATE DATABASE chat_db;
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Run migrations:
```bash
npm run db:migrate
```

5. Seed database (optional):
```bash
npm run db:seed
```

6. Start server:
```bash
npm run dev  # Development
npm start    # Production
```

## Environment Variables

See `.env.example` for all available configuration options:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 4000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database configuration
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - JWT signing secrets
- `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` - Token expiration times
- `UPLOAD_DIR` - Profile picture upload directory
- `MAX_FILE_SIZE` - Maximum file size in bytes (default: 5MB)
- `ALLOWED_FILE_TYPES` - Comma-separated MIME types

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Users

- `GET /api/users` - Get paginated list of users (authenticated)
- `POST /api/users/:id/profile-pictures` - Upload profile pictures
- `PATCH /api/users/:id/profile-pictures/:pictureId/default` - Set default picture
- `DELETE /api/users/:id/profile-pictures/:pictureId` - Delete picture

### Conversations

- `POST /api/conversations` - Create conversation
- `GET /api/conversations` - Get user's conversations
- `GET /api/conversations/:id` - Get conversation by ID

### Messages

- `POST /api/messages` - Create message
- `GET /api/messages/conversations/:id/messages` - Get conversation messages (paginated)

## Socket.IO Events

### Client → Server

- `join:conversation` - Join conversation room
- `leave:conversation` - Leave conversation room
- `message:new` - Send new message
- `message:seen` - Mark message as seen
- `typing:start` - Indicate typing started
- `typing:stop` - Indicate typing stopped

### Server → Client

- `joined:conversation` - Confirmation of joining room
- `left:conversation` - Confirmation of leaving room
- `message:new` - New message received
- `message:seen` - Message marked as seen
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `error` - Error occurred

### Socket.IO Authentication

Connect with JWT token in handshake:

```javascript
const socket = io('http://localhost:4000', {
  auth: {
    token: 'your-access-token'
  }
});
```

## Database Schema

### Users
- `id`, `email` (unique), `password` (hashed), `name`, `role` (user/admin), `createdAt`, `updatedAt`

### Conversations
- `id`, `userAId`, `userBId`, `createdAt`, `updatedAt`
- Unique constraint on (userAId, userBId)

### Messages
- `id`, `conversationId`, `senderId`, `content`, `isSeen`, `createdAt`, `updatedAt`
- Index on (conversationId, createdAt)

### UserProfileImage
- `id`, `userId`, `url`, `isDefault`, `createdAt`, `updatedAt`
- Unique constraint on (userId, isDefault) where isDefault = true

### RefreshToken
- `id`, `userId`, `token`, `expiresAt`, `createdAt`

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

Run tests in watch mode:
```bash
npm run test:watch
```

## API Documentation

Swagger documentation is available at:
```
http://localhost:4000/api-docs
```

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database (WARNING: deletes all data)

## Project Structure

```
.
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Express middleware
├── models/         # Sequelize models
├── routes/          # API routes
├── scripts/         # Database scripts
├── socket/          # Socket.IO handlers
├── tests/           # Test files
├── uploads/         # Uploaded files
├── utils/           # Utility functions
├── server.js        # Main server file
└── package.json
```

## Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Prevent abuse
- **JWT Tokens** - Secure authentication
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Zod schema validation
- **SQL Injection Protection** - Sequelize ORM

## Performance Optimizations

- Database indexes on frequently queried fields
- Cursor-based pagination for large datasets
- Connection pooling
- Compression middleware
- Efficient query optimization

## License

ISC

## Support

For issues and questions, please open an issue in the repository.

