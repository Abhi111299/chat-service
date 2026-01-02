# Secure Chat API - Architecture & Security

## Slide 1: Project Overview
**Secure Chat API**
- Real-time chat backend with JWT authentication
- Built with Node.js, Express, MySQL, Sequelize, Socket.IO
- Features: Role-based access, profile pictures, real-time messaging
- Production-ready with Docker support

## Slide 2: Architecture

**Layered Architecture**
```
┌─────────────────┐
│   Client Apps   │
└────────┬────────┘
         │
┌────────▼────────┐
│  Express API    │  ← RESTful endpoints
│  + Socket.IO    │  ← Real-time events
└────────┬────────┘
         │
┌────────▼────────┐
│   Sequelize     │  ← ORM layer
└────────┬────────┘
         │
┌────────▼────────┐
│     MySQL       │  ← Database
└─────────────────┘
```

**Key Components:**
- Controllers: Business logic
- Models: Data layer with associations
- Middleware: Auth, validation, error handling
- Socket.IO: Real-time communication

## Slide 3: Authentication & Authorization

**JWT Token Flow**
1. User registers/logs in → Receives access + refresh tokens
2. Access token (15min) for API requests
3. Refresh token (7 days) stored in database
4. Token rotation on refresh for security

**Role-Based Access Control:**
- User role: Access own data
- Admin role: Full system access
- Middleware enforces permissions

**Security Features:**
- Password hashing with bcrypt (10 rounds)
- Token invalidation on logout
- Refresh token rotation prevents reuse

## Slide 4: Database Design

**Core Models:**
- `User`: Authentication & profile
- `Conversation`: Two-user chat rooms
- `Message`: Chat messages with metadata
- `UserProfileImage`: Multiple images per user
- `RefreshToken`: Token management

**Indexes for Performance:**
- `Message(conversationId, createdAt)` - Fast message retrieval
- `Conversation(userAId, userBId)` - Unique conversation lookup
- `UserProfileImage(userId, isDefault)` - Default picture constraint

**Relationships:**
- User ↔ Conversation (many-to-many via userA/userB)
- Conversation → Message (one-to-many)
- User → Message (one-to-many)
- User → UserProfileImage (one-to-many)

## Slide 5: Real-Time Features

**Socket.IO Integration:**
- Authenticated connections via JWT
- Room-based messaging per conversation
- Event-driven architecture

**Events:**
- `message:new` - Broadcast new messages
- `message:seen` - Mark read receipts
- `typing:start/stop` - Typing indicators
- `join/leave:conversation` - Room management

**Benefits:**
- Instant message delivery
- Real-time status updates
- Low latency communication

## Slide 6: Security Measures

**Application Security:**
- Helmet.js: Security headers (XSS, clickjacking protection)
- CORS: Controlled cross-origin access
- Rate Limiting: Prevent abuse (100 req/15min)
- Input Validation: Zod schemas for all inputs
- SQL Injection Protection: Sequelize ORM

**Authentication Security:**
- JWT with short-lived access tokens
- Refresh token rotation
- Token invalidation on logout
- Secure password storage (bcrypt)

**File Upload Security:**
- File type validation (JPEG/PNG only)
- Size limits (2-5MB)
- Secure file storage
- User permission checks

## Slide 7: Performance & Scalability

**Optimizations:**
- Database indexes on frequently queried fields
- Cursor-based pagination (efficient for large datasets)
- Connection pooling (Sequelize)
- Compression middleware
- Efficient query optimization

**Scalability:**
- Stateless API design
- Horizontal scaling ready
- Docker containerization
- Database connection pooling

**Monitoring:**
- Request logging (Morgan/Pino)
- Error tracking
- Health check endpoint
- Test coverage with Jest

---

**Deployment:**
- Docker Compose for local development
- Environment-based configuration
- Database migrations
- Seed scripts for testing

