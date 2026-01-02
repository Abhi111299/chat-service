const { Conversation, User, Message } = require('../models');
const { Op } = require('sequelize');

class ConversationService {
    async createConversation(userAId, userBId) {
        // Check if userB exists
        const userB = await User.findByPk(userBId);
        if (!userB) {
            throw new Error('User not found');
        }

        if (userAId === userBId) {
            throw new Error('Cannot create conversation with yourself');
        }

        // Check if conversation already exists
        const existingConversation = await Conversation.findOne({
            where: {
                [ Op.or ]: [
                    { userAId, userBId },
                    { userAId: userBId, userBId: userAId }
                ]
            },
            include: [
                { model: User, as: 'userA', attributes: [ 'id', 'email', 'name' ] },
                { model: User, as: 'userB', attributes: [ 'id', 'email', 'name' ] }
            ]
        });

        if (existingConversation) {
            return {
                isNew: false,
                conversation: existingConversation
            };
        }

        // Create conversation
        const conversation = await Conversation.create({
            userAId,
            userBId
        });

        // Load with user details
        const conversationWithUsers = await Conversation.findByPk(conversation.id, {
            include: [
                { model: User, as: 'userA', attributes: [ 'id', 'email', 'name' ] },
                { model: User, as: 'userB', attributes: [ 'id', 'email', 'name' ] }
            ]
        });

        return {
            isNew: true,
            conversation: conversationWithUsers
        };
    }

    async getConversations(userId) {
        const conversations = await Conversation.findAll({
            where: {
                [ Op.or ]: [
                    { userAId: userId },
                    { userBId: userId }
                ]
            },
            include: [
                { model: User, as: 'userA', attributes: [ 'id', 'email', 'name' ] },
                { model: User, as: 'userB', attributes: [ 'id', 'email', 'name' ] }
            ],
            order: [ [ 'updatedAt', 'DESC' ] ]
        });

        // Enhance conversations with last message and unread count
        const enhancedConversations = await Promise.all(
            conversations.map(async (conversation) => {
                // Get last message
                const lastMessage = await Message.findOne({
                    where: { conversationId: conversation.id },
                    order: [ [ 'createdAt', 'DESC' ] ],
                    attributes: [ 'id', 'content', 'senderId', 'isSeen', 'createdAt' ]
                });

                // Get unread count (messages not seen by current user)
                const unreadCount = await Message.count({
                    where: {
                        conversationId: conversation.id,
                        senderId: { [ Op.ne ]: userId },
                        isSeen: false
                    }
                });

                // Determine the other user (the one you're chatting with)
                const otherUser = conversation.userAId === userId
                    ? conversation.userB
                    : conversation.userA;

                return {
                    id: conversation.id,
                    otherUser: {
                        id: otherUser.id,
                        name: otherUser.name,
                        email: otherUser.email
                    },
                    lastMessage: lastMessage ? {
                        id: lastMessage.id,
                        content: lastMessage.content,
                        senderId: lastMessage.senderId,
                        isSeen: lastMessage.isSeen,
                        createdAt: lastMessage.createdAt
                    } : null,
                    unreadCount,
                    updatedAt: conversation.updatedAt,
                    createdAt: conversation.createdAt
                };
            })
        );

        return enhancedConversations;
    }

    async getConversationById(conversationId, userId) {
        const conversation = await Conversation.findOne({
            where: {
                id: conversationId,
                [ Op.or ]: [
                    { userAId: userId },
                    { userBId: userId }
                ]
            },
            include: [
                { model: User, as: 'userA', attributes: [ 'id', 'email', 'name' ] },
                { model: User, as: 'userB', attributes: [ 'id', 'email', 'name' ] }
            ]
        });

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        return conversation;
    }

    async verifyConversationAccess(conversationId, userId) {
        const conversation = await Conversation.findOne({
            where: {
                id: conversationId,
                [ Op.or ]: [
                    { userAId: userId },
                    { userBId: userId }
                ]
            }
        });

        if (!conversation) {
            throw new Error('Conversation not found or access denied');
        }

        return conversation;
    }
}

module.exports = new ConversationService();

