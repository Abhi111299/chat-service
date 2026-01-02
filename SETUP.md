# Quick Setup Guide

## Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose (recommended)

## Quick Start with Docker

1. **Clone and setup:**
```bash
git clone <repository-url>
cd chat
cp .env.example .env
```

2. **Start services:**
```bash
docker-compose up -d
```

3. **Initialize database:**
```bash
# Wait for MySQL to be ready (about 10 seconds)
docker-compose exec app npm run db:migrate
docker-compose exec app npm run db:seed
```

4. **Access the API:**
- API: http://localhost:4000
- Swagger Docs: http://localhost:4000/api-docs
- Health Check: http://localhost:4000/health

## Manual Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Setup MySQL:**
```bash
mysql -u root -p
CREATE DATABASE chat_db;
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with database credentials
```

4. **Initialize database:**
```bash
npm run db:migrate
npm run db:seed
```

5. **Start server:**
```bash
npm run dev
```

## Test Credentials (from seeder)

- Admin: `admin@example.com` / `admin123`
- User 1: `user1@example.com` / `user123`
- User 2: `user2@example.com` / `user123`
- User 3: `user3@example.com` / `user123`

## Testing

```bash
npm test
```

## API Usage Example

```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get users (with token from login)
curl -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

**Database connection errors:**
- Ensure MySQL is running
- Check credentials in `.env`
- Wait for MySQL to be ready (Docker: ~10 seconds)

**Port already in use:**
- Change `PORT` in `.env`
- Or stop the service using port 4000

**Permission errors (uploads):**
- Ensure `uploads/profile-pictures` directory exists
- Check write permissions

