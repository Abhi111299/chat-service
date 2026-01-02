const request = require('supertest');
const { app } = require('../server');
const { User, RefreshToken } = require('../models');
const bcrypt = require('bcryptjs');

describe('Authentication API', () => {
  let testUser;

  beforeAll(async () => {
    // Clean up test data
    await RefreshToken.destroy({ where: {} });
    await User.destroy({ where: { email: 'test@example.com' } });
    await User.destroy({ where: { email: 'test2@example.com' } });
    await User.destroy({ where: { email: 'admin@test.com' } });
  });

  afterAll(async () => {
    await RefreshToken.destroy({ where: {} });
    await User.destroy({ where: { email: 'test@example.com' } });
    await User.destroy({ where: { email: 'test2@example.com' } });
    await User.destroy({ where: { email: 'admin@test.com' } });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'testpassword123',
          name: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.role).toBe('user');
      expect(response.body.user).not.toHaveProperty('password');
      testUser = response.body.user;
    });

    it('should register user with admin role when specified', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'admin@test.com',
          password: 'adminpassword123',
          name: 'Admin User',
          role: 'admin'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('admin');
    });

    it('should hash password and not return it in response', async () => {
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      expect(user.password).not.toBe('testpassword123');
      expect(user.password.length).toBeGreaterThan(20); // bcrypt hash length
    });

    it('should fail with duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'testpassword123',
          name: 'Test User'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBeDefined();
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'testpassword123',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail with short password (less than 8 characters)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'short',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com'
        });

      expect(response.status).toBe(400);
    });

    it('should fail with empty name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'testpassword123',
          name: ''
        });

      expect(response.status).toBe(400);
    });

    it('should fail with invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'testpassword123',
          name: 'Test User',
          role: 'invalid_role'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'testpassword123'
        });

      expect(response.status).toBe(400);
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'testpassword123'
        });

      expect(response.status).toBe(400);
    });

    it('should store refresh token in database on login', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      const refreshToken = loginResponse.body.refreshToken;
      const tokenRecord = await RefreshToken.findOne({
        where: { token: refreshToken }
      });

      expect(tokenRecord).toBeTruthy();
      expect(tokenRecord.userId).toBe(testUser.id);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });
      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.refreshToken).not.toBe(refreshToken); // Should rotate
    });

    it('should invalidate old refresh token after rotation', async () => {
      const oldToken = refreshToken;
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: oldToken
        });

      // Try to use old token again
      const secondRefresh = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: oldToken
        });

      expect(secondRefresh.status).toBe(401);
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token'
        });

      expect(response.status).toBe(401);
    });

    it('should fail with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should fail with expired refresh token', async () => {
      // Create an expired token manually
      const expiredToken = await RefreshToken.create({
        userId: testUser.id,
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'expired-token'
        });

      expect(response.status).toBe(401);
      await expiredToken.destroy();
    });
  });

  describe('POST /api/auth/logout', () => {
    let refreshToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });
      refreshToken = loginResponse.body.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: refreshToken
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should invalidate refresh token after logout', async () => {
      await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: refreshToken
        });

      // Try to refresh with invalidated token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        });

      expect(refreshResponse.status).toBe(401);
    });

    it('should fail with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should handle logout of non-existent token gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: 'non-existent-token'
        });

      // Should still return 200 as logout is idempotent
      expect(response.status).toBe(200);
    });
  });
});
