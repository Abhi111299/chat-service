const request = require('supertest');
const { app } = require('../server');
const { User, Conversation, Message } = require('../models');
const { generateAccessToken } = require('../utils/jwt');

describe('Messages API', () => {
    let user1Token;
    let user2Token;
    let user3Token;
    let user1;
    let user2;
    let user3;
    let conversation;

    beforeAll(async () => {
        // Create test users
        user1 = await User.create({
            email: 'msguser1@example.com',
            password: 'hashedpassword',
            name: 'User 1',
            role: 'user'
        });

        user2 = await User.create({
            email: 'msguser2@example.com',
            password: 'hashedpassword',
            name: 'User 2',
            role: 'user'
        });

        user3 = await User.create({
            email: 'msguser3@example.com',
            password: 'hashedpassword',
            name: 'User 3',
            role: 'user'
        });

        user1Token = generateAccessToken({
            userId: user1.id,
            email: user1.email,
            role: user1.role
        });

        user2Token = generateAccessToken({
            userId: user2.id,
            email: user2.email,
            role: user2.role
        });

        user3Token = generateAccessToken({
            userId: user3.id,
            email: user3.email,
            role: user3.role
        });

        // Create conversation
        conversation = await Conversation.create({
            userAId: user1.id,
            userBId: user2.id
        });
    });

    afterAll(async () => {
        await Message.destroy({ where: {} });
        await Conversation.destroy({ where: {} });
        await User.destroy({ where: { email: 'msguser1@example.com' } });
        await User.destroy({ where: { email: 'msguser2@example.com' } });
        await User.destroy({ where: { email: 'msguser3@example.com' } });
    });

    describe('POST /api/messages', () => {
        it('should create a new message', async () => {
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    conversationId: conversation.id,
                    content: 'Hello, this is a test message!'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data.content).toBe('Hello, this is a test message!');
            expect(response.body.data.senderId).toBe(user1.id);
            expect(response.body.data.conversationId).toBe(conversation.id);
        });

        it('should include sender details in response', async () => {
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    conversationId: conversation.id,
                    content: 'Message with sender details'
                });

            expect(response.body.data).toHaveProperty('sender');
            expect(response.body.data.sender.id).toBe(user1.id);
            expect(response.body.data.sender.name).toBe('User 1');
        });

        it('should update conversation updatedAt when message is created', async () => {
            const oldUpdatedAt = new Date(conversation.updatedAt);

            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

            await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    conversationId: conversation.id,
                    content: 'Update conversation timestamp'
                });

            await conversation.reload();
            expect(new Date(conversation.updatedAt).getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
        });

        it('should fail with non-existent conversation', async () => {
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    conversationId: 99999,
                    content: 'Test message'
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Conversation not found or access denied');
        });

        it('should fail when user is not part of conversation', async () => {
            const otherConversation = await Conversation.create({
                userAId: user2.id,
                userBId: user3.id
            });

            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    conversationId: otherConversation.id,
                    content: 'Unauthorized message'
                });

            expect(response.status).toBe(404);
            await otherConversation.destroy();
        });

        it('should fail with empty content', async () => {
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    conversationId: conversation.id,
                    content: ''
                });

            expect(response.status).toBe(400);
        });

        it('should fail with missing content', async () => {
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    conversationId: conversation.id
                });

            expect(response.status).toBe(400);
        });

        it('should fail with missing conversationId', async () => {
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    content: 'Test message'
                });

            expect(response.status).toBe(400);
        });

        it('should fail with content exceeding max length', async () => {
            const longContent = 'a'.repeat(5001); // Exceeds 5000 char limit
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    conversationId: conversation.id,
                    content: longContent
                });

            expect(response.status).toBe(400);
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .post('/api/messages')
                .send({
                    conversationId: conversation.id,
                    content: 'Test message'
                });

            expect(response.status).toBe(401);
        });

        it('should fail with invalid conversationId type', async () => {
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    conversationId: 'invalid',
                    content: 'Test message'
                });

            expect(response.status).toBe(400);
        });

        it('should allow both participants to send messages', async () => {
            const response1 = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    conversationId: conversation.id,
                    content: 'Message from user1'
                });

            const response2 = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${user2Token}`)
                .send({
                    conversationId: conversation.id,
                    content: 'Message from user2'
                });

            expect(response1.status).toBe(201);
            expect(response2.status).toBe(201);
        });
    });
});

