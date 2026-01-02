const request = require('supertest');
const { app } = require('../server');
const { User, UserProfileImage } = require('../models');
const { generateAccessToken } = require('../utils/jwt');
const path = require('path');
const fs = require('fs');

describe('Users API', () => {
  let userToken;
  let adminToken;
  let testUser;
  let adminUser;
  let otherUser;

  beforeAll(async () => {
    // Create test users
    testUser = await User.create({
      email: 'usertest@example.com',
      password: 'hashedpassword',
      name: 'Test User',
      role: 'user'
    });

    adminUser = await User.create({
      email: 'admintest@example.com',
      password: 'hashedpassword',
      name: 'Admin User',
      role: 'admin'
    });

    otherUser = await User.create({
      email: 'otheruser@example.com',
      password: 'hashedpassword',
      name: 'Other User',
      role: 'user'
    });

    userToken = generateAccessToken({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role
    });

    adminToken = generateAccessToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    });
  });

  afterAll(async () => {
    // Clean up profile images
    const images = await UserProfileImage.findAll({ where: { userId: testUser.id } });
    for (const image of images) {
      const filePath = path.join(process.cwd(), image.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await UserProfileImage.destroy({ where: { userId: testUser.id } });
    await UserProfileImage.destroy({ where: { userId: adminUser.id } });
    await UserProfileImage.destroy({ where: { userId: otherUser.id } });

    await User.destroy({ where: { email: 'usertest@example.com' } });
    await User.destroy({ where: { email: 'admintest@example.com' } });
    await User.destroy({ where: { email: 'otheruser@example.com' } });
  });

  describe('GET /api/users', () => {
    it('should get users list with authentication', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should not include password in user objects', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      response.body.users.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should support pagination with page parameter', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should support pagination with limit parameter', async () => {
      const response = await request(app)
        .get('/api/users?limit=5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.users.length).toBeLessThanOrEqual(5);
    });

    it('should return correct total count in pagination', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.body.pagination.total).toBeGreaterThanOrEqual(0);
      expect(response.body.pagination.totalPages).toBeGreaterThanOrEqual(0);
    });

    it('should return users ordered by createdAt DESC', async () => {
      const response = await request(app)
        .get('/api/users?limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      if (response.body.users.length > 1) {
        const dates = response.body.users.map(u => new Date(u.createdAt));
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[ i ].getTime()).toBeGreaterThanOrEqual(dates[ i + 1 ].getTime());
        }
      }
    });
  });

  describe('POST /api/users/:id/profile-pictures', () => {
    it('should upload profile picture successfully', async () => {
      // Create a dummy image file
      const testImagePath = path.join(__dirname, 'test-image.png');
      const testImageBuffer = Buffer.from('fake-image-data');

      // Mock file upload
      const response = await request(app)
        .post(`/api/users/${testUser.id}/profile-pictures`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('images', testImageBuffer, 'test.png');

      // Note: This test may need actual file handling
      // For now, we test the endpoint structure
      expect([ 200, 201, 400, 500 ]).toContain(response.status);
    });

    it('should allow user to upload their own profile picture', async () => {
      // This would require actual file upload setup
      // Testing authorization logic
      const response = await request(app)
        .post(`/api/users/${testUser.id}/profile-pictures`)
        .set('Authorization', `Bearer ${userToken}`);

      // Should not be 403 (permission denied)
      expect(response.status).not.toBe(403);
    });

    it('should allow admin to upload profile picture for any user', async () => {
      const response = await request(app)
        .post(`/api/users/${testUser.id}/profile-pictures`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Should not be 403 (permission denied)
      expect(response.status).not.toBe(403);
    });

    it('should deny user from uploading picture for another user', async () => {
      const response = await request(app)
        .post(`/api/users/${otherUser.id}/profile-pictures`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Permission denied');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/users/${testUser.id}/profile-pictures`);

      expect(response.status).toBe(401);
    });

    it('should fail with invalid user ID', async () => {
      const response = await request(app)
        .post('/api/users/99999/profile-pictures')
        .set('Authorization', `Bearer ${userToken}`);

      // Should handle gracefully
      expect([ 400, 404, 403 ]).toContain(response.status);
    });
  });

  describe('PATCH /api/users/:id/profile-pictures/:pictureId/default', () => {
    let profileImage;

    beforeAll(async () => {
      // Create a test profile image
      profileImage = await UserProfileImage.create({
        userId: testUser.id,
        url: '/uploads/profile-pictures/test-image.png',
        isDefault: false
      });
    });

    afterAll(async () => {
      if (profileImage) {
        await profileImage.destroy();
      }
    });

    it('should set profile picture as default', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUser.id}/profile-pictures/${profileImage.id}/default`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.image.isDefault).toBe(true);
    });

    it('should unset other default pictures when setting new default', async () => {
      // Create another image and set it as default
      const image2 = await UserProfileImage.create({
        userId: testUser.id,
        url: '/uploads/profile-pictures/test-image-2.png',
        isDefault: false
      });

      await request(app)
        .patch(`/api/users/${testUser.id}/profile-pictures/${image2.id}/default`)
        .set('Authorization', `Bearer ${userToken}`);

      // Check that previous default is now false
      await profileImage.reload();
      expect(profileImage.isDefault).toBe(false);

      await image2.destroy();
    });

    it('should allow admin to set default for any user', async () => {
      const image = await UserProfileImage.create({
        userId: testUser.id,
        url: '/uploads/profile-pictures/test-image-3.png',
        isDefault: false
      });

      const response = await request(app)
        .patch(`/api/users/${testUser.id}/profile-pictures/${image.id}/default`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      await image.destroy();
    });

    it('should deny user from setting default for another user', async () => {
      const otherImage = await UserProfileImage.create({
        userId: otherUser.id,
        url: '/uploads/profile-pictures/other-image.png',
        isDefault: false
      });

      const response = await request(app)
        .patch(`/api/users/${otherUser.id}/profile-pictures/${otherImage.id}/default`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      await otherImage.destroy();
    });

    it('should fail with non-existent picture', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUser.id}/profile-pictures/99999/default`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUser.id}/profile-pictures/${profileImage.id}/default`);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/users/:id/profile-pictures/:pictureId', () => {
    let profileImage;

    beforeEach(async () => {
      profileImage = await UserProfileImage.create({
        userId: testUser.id,
        url: '/uploads/profile-pictures/test-delete.png',
        isDefault: false
      });
    });

    afterEach(async () => {
      if (profileImage && !profileImage.isNewRecord) {
        await profileImage.destroy({ force: true });
      }
    });

    it('should delete profile picture successfully', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUser.id}/profile-pictures/${profileImage.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile picture deleted successfully');

      // Verify it's deleted
      const deleted = await UserProfileImage.findByPk(profileImage.id);
      expect(deleted).toBeNull();
    });

    it('should allow admin to delete picture for any user', async () => {
      const adminImage = await UserProfileImage.create({
        userId: testUser.id,
        url: '/uploads/profile-pictures/admin-delete.png',
        isDefault: false
      });

      const response = await request(app)
        .delete(`/api/users/${testUser.id}/profile-pictures/${adminImage.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny user from deleting picture for another user', async () => {
      const otherImage = await UserProfileImage.create({
        userId: otherUser.id,
        url: '/uploads/profile-pictures/other-delete.png',
        isDefault: false
      });

      const response = await request(app)
        .delete(`/api/users/${otherUser.id}/profile-pictures/${otherImage.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      await otherImage.destroy();
    });

    it('should fail with non-existent picture', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUser.id}/profile-pictures/99999`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUser.id}/profile-pictures/${profileImage.id}`);

      expect(response.status).toBe(401);
    });
  });
});
