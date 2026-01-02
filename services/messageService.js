const { Message, Conversation, User } = require('../models');
const { Op } = require('sequelize');
const conversationService = require('./conversationService');

class MessageService {
    async createMessage(conversationId, senderId, content) {
        // Verify conversation exists and user is part of it
        await conversationService.verifyConversationAccess(conversationId, senderId);

        // Create message
        const message = await Message.create({
            conversationId,
            senderId,
            content
        });

        // Update conversation updatedAt
        await Conversation.update(
            { updatedAt: new Date() },
            { where: { id: conversationId } }
        );

        // Load message with sender details
        const messageWithSender = await Message.findByPk(message.id, {
            include: [
                { model: User, as: 'sender', attributes: [ 'id', 'email', 'name' ] }
            ]
        });

        return messageWithSender;
    }

    async getConversationMessages(conversationId, userId, options = {}) {
        const { limit = 20, cursor } = options;

        // Verify conversation access
        await conversationService.verifyConversationAccess(conversationId, userId);

        // Build query
        const whereClause = { conversationId };
        if (cursor) {
            whereClause.id = { [ Op.lt ]: parseInt(cursor) };
        }

        const messages = await Message.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'sender', attributes: [ 'id', 'email', 'name' ] }
            ],
            order: [ [ 'id', 'DESC' ] ],
            limit: parseInt(limit) + 1
        });

        const hasMore = messages.length > parseInt(limit);
        const result = hasMore ? messages.slice(0, -1) : messages;
        const nextCursor = hasMore ? result[ result.length - 1 ].id : null;

        // Reverse to show newest message last
        result.reverse();

        return {
            messages: result,
            pagination: {
                hasMore,
                nextCursor,
                limit: parseInt(limit)
            }
        };
    }
}

module.exports = new MessageService();

