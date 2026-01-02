const request = require('supertest');
const { app } = require('../server');
const { User, Conversation, Message } = require('../models');
const { generateAccessToken } = require('../utils/jwt');

describe('Conversations API', () => {
    let user1Token;
    let user2Token;
    let user3Token;
    let adminToken;
    let user1;
    let user2;
    let user3;
    let admin;

    beforeAll(async () => {
        // Create test users
        user1 = await User.create({
            email: 'convuser1@example.com',
            password: 'hashedpassword',
            name: 'User 1',
            role: 'user'
        });

        user2 = await User.create({
            email: 'convuser2@example.com',
            password: 'hashedpassword',
            name: 'User 2',
            role: 'user'
        });

        user3 = await User.create({
            email: 'convuser3@example.com',
            password: 'hashedpassword',
            name: 'User 3',
            role: 'user'
        });

        admin = await User.create({
            email: 'convadmin@example.com',
            password: 'hashedpassword',
            name: 'Admin',
            role: 'admin'
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

        adminToken = generateAccessToken({
            userId: admin.id,
            email: admin.email,
            role: admin.role
        });
    });

    afterAll(async () => {
        await Message.destroy({ where: {} });
        await Conversation.destroy({ where: {} });
        await User.destroy({ where: { email: 'convuser1@example.com' } });
        await User.destroy({ where: { email: 'convuser2@example.com' } });
        await User.destroy({ where: { email: 'convuser3@example.com' } });
        await User.destroy({ where: { email: 'convadmin@example.com' } });
    });

    describe('POST /api/conversations', () => {
        it('should create a new conversation', async () => {
            const response = await request(app)
                .post('/api/conversations')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    userBId: user2.id
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('conversation');
            expect(response.body.conversation.userAId).toBe(user1.id);
            expect(response.body.conversation.userBId).toBe(user2.id);
        });

        it('should return existing conversation if already exists', async () => {
            // Create conversation first
            await Conversation.create({
                userAId: user1.id,
                userBId: user3.id
            });

            const response = await request(app)
                .post('/api/conversations')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    userBId: user3.id
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Conversation already exists');
        });

        it('should prevent creating conversation with self', async () => {
            const response = await request(app)
                .post('/api/conversations')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    userBId: user1.id
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Cannot create conversation with yourself');
        });

        it('should fail with non-existent user', async () => {
            const response = await request(app)
                .post('/api/conversations')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    userBId: 99999
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .post('/api/conversations')
                .send({
                    userBId: user2.id
                });

            expect(response.status).toBe(401);
        });

        it('should fail with missing userBId', async () => {
            const response = await request(app)
                .post('/api/conversations')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({});

            expect(response.status).toBe(400);
        });

        it('should fail with invalid userBId type', async () => {
            const response = await request(app)
                .post('/api/conversations')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    userBId: 'invalid'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/conversations', () => {
        let conversation1;
        let conversation2;

        beforeAll(async () => {
            // Create test conversations
            conversation1 = await Conversation.create({
                userAId: user1.id,
                userBId: user2.id
            });

            conversation2 = await Conversation.create({
                userAId: user2.id,
                userBId: user3.id
            });
        });

        it('should get all conversations for authenticated user', async () => {
            const response = await request(app)
                .get('/api/conversations')
                .set('Authorization', `Bearer ${user1Token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('conversations');
            expect(Array.isArray(response.body.conversations)).toBe(true);
        });

        it('should only return conversations where user is participant', async () => {
            const response = await request(app)
                .get('/api/conversations')
                .set('Authorization', `Bearer ${user1Token}`);

            response.body.conversations.forEach(conv => {
                expect(
                    conv.userAId === user1.id || conv.userBId === user1.id
                ).toBe(true);
            });
        });

        it('should include user details in conversation', async () => {
            const response = await request(app)
                .get('/api/conversations')
                .set('Authorization', `Bearer ${user1Token}`);

            if (response.body.conversations.length > 0) {
                const conv = response.body.conversations[ 0 ];
                expect(conv).toHaveProperty('userA');
                expect(conv).toHaveProperty('userB');
                expect(conv.userA).toHaveProperty('id');
                expect(conv.userA).toHaveProperty('name');
                expect(conv.userA).toHaveProperty('email');
            }
        });

        it('should return conversations ordered by updatedAt DESC', async () => {
            // Update conversation to change updatedAt
            await conversation1.update({ updatedAt: new Date() });

            const response = await request(app)
                .get('/api/conversations')
                .set('Authorization', `Bearer ${user1Token}`);

            if (response.body.conversations.length > 1) {
                const dates = response.body.conversations.map(c => new Date(c.updatedAt));
                for (let i = 0; i < dates.length - 1; i++) {
                    expect(dates[ i ].getTime()).toBeGreaterThanOrEqual(dates[ i + 1 ].getTime());
                }
            }
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/conversations');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/conversations/:id', () => {
        let conversation;

        beforeAll(async () => {
            conversation = await Conversation.create({
                userAId: user1.id,
                userBId: user2.id
            });
        });

        it('should get conversation by ID', async () => {
            const response = await request(app)
                .get(`/api/conversations/${conversation.id}`)
                .set('Authorization', `Bearer ${user1Token}`);

            expect(response.status).toBe(200);
            expect(response.body.conversation.id).toBe(conversation.id);
        });

        it('should include user details', async () => {
            const response = await request(app)
                .get(`/api/conversations/${conversation.id}`)
                .set('Authorization', `Bearer ${user1Token}`);

            expect(response.body.conversation).toHaveProperty('userA');
            expect(response.body.conversation).toHaveProperty('userB');
        });

        it('should allow access to conversation participant', async () => {
            const response = await request(app)
                .get(`/api/conversations/${conversation.id}`)
                .set('Authorization', `Bearer ${user2Token}`);

            expect(response.status).toBe(200);
        });

        it('should deny access to non-participant', async () => {
            const response = await request(app)
                .get(`/api/conversations/${conversation.id}`)
                .set('Authorization', `Bearer ${user3Token}`);

            expect(response.status).toBe(404);
        });

        it('should fail with non-existent conversation', async () => {
            const response = await request(app)
                .get('/api/conversations/99999')
                .set('Authorization', `Bearer ${user1Token}`);

            expect(response.status).toBe(404);
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get(`/api/conversations/${conversation.id}`);

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/conversations/:id/messages', () => {
        let conversation;

        beforeAll(async () => {
            conversation = await Conversation.create({
                userAId: user1.id,
                userBId: user2.id
            });

            // Create test messages
            await Message.bulkCreate([
                {
                    conversationId: conversation.id,
                    senderId: user1.id,
                    content: 'Message 1',
                    isSeen: false
                },
                {
                    conversationId: conversation.id,
                    senderId: user2.id,
                    content: 'Message 2',
                    isSeen: false
                },
                {
                    conversationId: conversation.id,
                    senderId: user1.id,
                    content: 'Message 3',
                    isSeen: false
                }
            ]);
        });

        it('should get messages for conversation', async () => {
            const response = await request(app)
                .get(`/api/conversations/${conversation.id}/messages`)
                .set('Authorization', `Bearer ${user1Token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('messages');
            expect(Array.isArray(response.body.messages)).toBe(true);
        });

        it('should include sender details in messages', async () => {
            const response = await request(app)
                .get(`/api/conversations/${conversation.id}/messages`)
                .set('Authorization', `Bearer ${user1Token}`);

            if (response.body.messages.length > 0) {
                const message = response.body.messages[ 0 ];
                expect(message).toHaveProperty('sender');
                expect(message.sender).toHaveProperty('id');
                expect(message.sender).toHaveProperty('name');
            }
        });

        it('should support pagination with limit', async () => {
            const response = await request(app)
                .get(`/api/conversations/${conversation.id}/messages?limit=2`)
                .set('Authorization', `Bearer ${user1Token}`);

            expect(response.status).toBe(200);
            expect(response.body.messages.length).toBeLessThanOrEqual(2);
            expect(response.body.pagination).toHaveProperty('limit');
        });

        it('should support cursor-based pagination', async () => {
            const firstResponse = await request(app)
                .get(`/api/conversations/${conversation.id}/messages?limit=2`)
                .set('Authorization', `Bearer ${user1Token}`);

            if (firstResponse.body.pagination.nextCursor) {
                const secondResponse = await request(app)
                    .get(`/api/conversations/${conversation.id}/messages?limit=2&cursor=${firstResponse.body.pagination.nextCursor}`)
                    .set('Authorization', `Bearer ${user1Token}`);

                expect(secondResponse.status).toBe(200);
            }
        });

        it('should return messages ordered newest last', async () => {
            const response = await request(app)
                .get(`/api/conversations/${conversation.id}/messages`)
                .set('Authorization', `Bearer ${user1Token}`);

            if (response.body.messages.length > 1) {
                const ids = response.body.messages.map(m => m.id);
                for (let i = 0; i < ids.length - 1; i++) {
                    expect(ids[ i ]).toBeLessThan(ids[ i + 1 ]);
                }
            }
        });

        it('should deny access to non-participant', async () => {
            const response = await request(app)
                .get(`/api/conversations/${conversation.id}/messages`)
                .set('Authorization', `Bearer ${user3Token}`);

            expect(response.status).toBe(404);
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get(`/api/conversations/${conversation.id}/messages`);

            expect(response.status).toBe(401);
        });
    });
});

