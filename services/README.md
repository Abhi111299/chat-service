# Services Layer

## Overview

The services layer contains all business logic, separated from HTTP request/response handling. This follows the **Service-Oriented Architecture** pattern, providing:

- **Separation of Concerns**: Business logic is independent of HTTP layer
- **Reusability**: Services can be used by controllers, Socket.IO handlers, or other modules
- **Testability**: Services can be unit tested without HTTP dependencies
- **Maintainability**: Clear separation makes code easier to maintain and modify

## Service Files

### `authService.js`
Handles authentication and authorization logic:
- `register(email, password, name, role)` - Register new user
- `login(email, password)` - Authenticate user
- `refreshToken(refreshToken)` - Refresh access token with rotation
- `logout(refreshToken)` - Invalidate refresh token
- `generateTokens(user)` - Generate access and refresh tokens
- `cleanupExpiredTokens(userId)` - Remove expired tokens

### `userService.js`
Manages user-related operations:
- `getUsers(page, limit)` - Get paginated user list
- `uploadProfilePictures(userId, files)` - Upload profile pictures
- `setDefaultProfilePicture(userId, pictureId)` - Set default picture
- `deleteProfilePicture(userId, pictureId)` - Delete picture
- `checkPermission(currentUserId, targetUserId, currentUserRole)` - Check access permissions

### `conversationService.js`
Handles conversation management:
- `createConversation(userAId, userBId)` - Create or find existing conversation
- `getConversations(userId)` - Get all conversations for user
- `getConversationById(conversationId, userId)` - Get conversation by ID
- `verifyConversationAccess(conversationId, userId)` - Verify user has access

### `messageService.js`
Manages message operations:
- `createMessage(conversationId, senderId, content)` - Create new message
- `getConversationMessages(conversationId, userId, options)` - Get paginated messages

## Architecture Pattern

```

  Routes      ← HTTP routing


  Controllers   ← HTTP request/response handling

      
  Services     ← Business logic

   Models      ← Data access

```

## Usage Example

### In Controllers
```javascript
const userService = require('../services/userService');

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.validated || {};
    const result = await userService.getUsers(page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
```

### In Socket.IO Handlers
```javascript
const messageService = require('../services/messageService');

socket.on('message:new', async (data) => {
  try {
    const message = await messageService.createMessage(
      data.conversationId,
      socket.userId,
      data.content
    );
    io.to(`conversation:${data.conversationId}`).emit('message:new', { message });
  } catch (error) {
    socket.emit('error', { message: error.message });
  }
});
```

## Error Handling

Services throw errors with descriptive messages. Controllers catch these and convert them to appropriate HTTP status codes:

- `Email already registered` → 409 Conflict
- `Invalid credentials` → 401 Unauthorized
- `Permission denied` → 403 Forbidden
- `User not found` → 404 Not Found
- `Conversation not found` → 404 Not Found

## Benefits

1. **Single Responsibility**: Each service has a clear, focused purpose
2. **DRY Principle**: Business logic is not duplicated across controllers
3. **Testability**: Services can be tested independently
4. **Flexibility**: Easy to add new interfaces (CLI, GraphQL, etc.)
5. **Maintainability**: Changes to business logic are centralized

## Testing

Services should be unit tested independently:

```javascript
const authService = require('../services/authService');

describe('AuthService', () => {
  it('should register a new user', async () => {
    const result = await authService.register(
      'test@example.com',
      'password123',
      'Test User'
    );
    expect(result.user.email).toBe('test@example.com');
  });
});
```

