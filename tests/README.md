# Test Suite Documentation

## Overview

This test suite provides comprehensive coverage for the Secure Chat API, designed to demonstrate thorough testing practices for an interview assignment.

## Test Files

### 1. `auth.test.js` - Authentication Tests
**Coverage:**
- User registration (success, validation, duplicates)
- User login (success, invalid credentials)
- Token refresh (rotation, invalidation)
- Logout (token invalidation)
- Edge cases and error scenarios

**Key Test Cases:**
-  Register with valid/invalid data
-  Login with correct/incorrect credentials
-  Refresh token rotation
-  Token expiration handling
-  Password hashing verification
-  Duplicate email prevention

### 2. `users.test.js` - User Management Tests
**Coverage:**
- User listing with pagination
- Profile picture upload
- Setting default profile picture
- Deleting profile pictures
- Authorization checks (user/admin permissions)

**Key Test Cases:**
-  Get users list (authenticated)
-  Pagination support
-  Profile picture upload
-  Default picture enforcement
-  Permission checks (own vs others)
-  Admin override permissions

### 3. `conversations.test.js` - Conversation Tests
**Coverage:**
- Creating conversations
- Retrieving user conversations
- Access control (participants only)
- Conversation uniqueness
- Message retrieval with pagination

**Key Test Cases:**
-  Create conversation
-  Prevent duplicate conversations
-  Prevent self-conversation
-  Get conversations for user
-  Access control enforcement
-  Message pagination

### 4. `messages.test.js` - Message Tests
**Coverage:**
- Creating messages
- Message validation
- Conversation updates
- Access control
- Content length limits

**Key Test Cases:**
-  Create message
-  Include sender details
-  Update conversation timestamp
-  Access control (participants only)
-  Content validation
-  Message length limits

### 5. `middleware.test.js` - Middleware Tests
**Coverage:**
- Authentication middleware
- Validation middleware
- Error handling
- Rate limiting

**Key Test Cases:**
-  Token validation
-  Missing/invalid tokens
-  Request validation
-  Error handling
-  Rate limit enforcement

### 6. `integration.test.js` - Integration Tests
**Coverage:**
- Complete user journeys
- Token refresh flow
- Logout and token reuse prevention
- Data consistency
- Referential integrity

**Key Test Cases:**
-  Full user flow (register → login → chat)
-  Token refresh workflow
-  Logout and security
-  Data integrity
-  Relationship consistency

## Running Tests

### Run all tests:
```bash
npm test
```

### Run with coverage:
```bash
npm test -- --coverage
```

### Run specific test file:
```bash
npm test -- auth.test.js
```

### Run in watch mode:
```bash
npm run test:watch
```

## Test Coverage Goals

- **Unit Tests**: Individual functions and methods
- **Integration Tests**: Complete workflows
- **Edge Cases**: Error scenarios, boundary conditions
- **Security Tests**: Authentication, authorization, validation
- **Performance Tests**: Pagination, query optimization

## Test Data Management

- Tests use isolated test data
- Cleanup in `beforeAll`/`afterAll` hooks
- Unique email addresses per test suite
- Database state reset between test runs

## Best Practices Demonstrated

1. **Isolation**: Each test suite uses unique data
2. **Cleanup**: Proper teardown after tests
3. **Coverage**: Tests for success and failure paths
4. **Readability**: Clear test descriptions
5. **Maintainability**: Reusable test setup
6. **Security**: Authorization and validation tests
7. **Integration**: End-to-end workflow tests

## Notes

- Tests require a running database connection
- Some tests may need adjustment based on environment
- File upload tests may require actual file handling setup
- Rate limiting tests may not always trigger in test environment

