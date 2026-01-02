const request = require('supertest');
const { app } = require('../server');
const { User, Conversation, Message, RefreshToken, UserProfileImage } = require('../models');
const bcrypt = require('bcryptjs');

describe('Integration Tests - Complete User Flow', () => {
    let user1Token;
    let user2Token;
    let user1;
    let user2;
    let conversation;
    let refreshToken;

    beforeAll(async () => {
        // Clean up any existing test data
        await Message.destroy({ where: {} });
        await Conversation.destroy({ where: {} });
        await UserProfileImage.destroy({ where: {} });
        await RefreshToken.destroy({ where: {} });
        await User.destroy({ where: { email: 'integration1@test.com' } });
        await User.destroy({ where: { email: 'integration2@test.com' } });
    });

    afterAll(async () => {
        await Message.destroy({ where: {} });
        await Conversation.destroy({ where: {} });
        await UserProfileImage.destroy({ where: {} });
        await RefreshToken.destroy({ where: {} });
        await User.destroy({ where: { email: 'integration1@test.com' } });
        await User.destroy({ where: { email: 'integration2@test.com' } });
    });

    describe('Complete User Journey', () => {
        it('should complete full user flow: register -> login -> create conversation -> send messages', async () => {
            // Step 1: Register user1
            const registerResponse1 = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'integration1@test.com',
                    password: 'password123',
                    name: 'Integration User 1'
                });

            expect(registerResponse1.status).toBe(201);
            user1Token = registerResponse1.body.accessToken;
            user1 = await User.findOne({ where: { email: 'integration1@test.com' } });

            // Step 2: Register user2
            const registerResponse2 = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'integration2@test.com',
                    password: 'password123',
                    name: 'Integration User 2'
                });

            expect(registerResponse2.status).toBe(201);
            user2Token = registerResponse2.body.accessToken;
            user2 = await User.findOne({ where: { email: 'integration2@test.com' } });

            // Step 3: User1 creates conversation with User2
            const conversationResponse = await request(app)
                .post('/api/conversations')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    userBId: user2.id
                });

            expect(conversationResponse.status).toBe(201);
            conversation = conversationResponse.body.conversation;

            // Step 4: User1 sends a message
            const messageResponse1 = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    conversationId: conversation.id,
                    content: 'Hello from User 1!'
                });

            expect(messageResponse1.status).toBe(201);
            expect(messageResponse1.body.data.content).toBe('Hello from User 1!');

            // Step 5: User2 sends a reply
            const messageResponse2 = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${user2Token}`)
                .send({
                    conversationId: conversation.id,
                    content: 'Hello back from User 2!'
                });

            expect(messageResponse2.status).toBe(201);

            // Step 6: User1 retrieves conversation messages
            const messagesResponse = await request(app)
                .get(`/api/conversations/${conversation.id}/messages`)
                .set('Authorization', `Bearer ${user1Token}`);

            expect(messagesResponse.status).toBe(200);
            expect(messagesResponse.body.messages.length).toBeGreaterThanOrEqual(2);
        });

        it('should handle token refresh flow', async () => {
            // Login to get refresh token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'integration1@test.com',
                    password: 'password123'
                });

            refreshToken = loginResponse.body.refreshToken;
            const oldAccessToken = loginResponse.body.accessToken;

            // Refresh tokens
            const refreshResponse = await request(app)
                .post('/api/auth/refresh')
                .send({
                    refreshToken: refreshToken
                });

            expect(refreshResponse.status).toBe(200);
            expect(refreshResponse.body.accessToken).not.toBe(oldAccessToken);

            // Use new access token
            const usersResponse = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${refreshResponse.body.accessToken}`);

            expect(usersResponse.status).toBe(200);
        });

        it('should handle logout and prevent token reuse', async () => {
            // Login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'integration1@test.com',
                    password: 'password123'
                });

            const token = loginResponse.body.refreshToken;

            // Logout
            const logoutResponse = await request(app)
                .post('/api/auth/logout')
                .send({
                    refreshToken: token
                });

            expect(logoutResponse.status).toBe(200);

            // Try to refresh with logged out token
            const refreshResponse = await request(app)
                .post('/api/auth/refresh')
                .send({
                    refreshToken: token
                });

            expect(refreshResponse.status).toBe(401);
        });
    });

    describe('Data Consistency Tests', () => {
        it('should maintain referential integrity', async () => {
            // Create conversation
            const conv = await Conversation.create({
                userAId: user1.id,
                userBId: user2.id
            });

            // Create message
            const message = await Message.create({
                conversationId: conv.id,
                senderId: user1.id,
                content: 'Test message'
            });

            // Verify relationships
            const loadedMessage = await Message.findByPk(message.id, {
                include: [
                    { model: Conversation, as: 'conversation' },
                    { model: User, as: 'sender' }
                ]
            });

            expect(loadedMessage.conversation.id).toBe(conv.id);
            expect(loadedMessage.sender.id).toBe(user1.id);

            await message.destroy();
            await conv.destroy();
        });

        it('should enforce unique email constraint', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'integration1@test.com',
                    password: 'password123',
                    name: 'Duplicate User'
                });

            expect(response.status).toBe(409);
        });
    });
});

