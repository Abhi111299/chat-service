const conversationService = require('../services/conversationService');

const createConversation = async (req, res, next) => {
  try {
    const { userBId } = req.validated;
    const userAId = req.userId;

    const result = await conversationService.createConversation(userAId, userBId);

    if (result.isNew) {
      res.status(201).json({
        success: true,
        message: 'Conversation created successfully',
        conversation: result.conversation
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Conversation already exists',
        conversation: result.conversation
      });
    }
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    if (error.message === 'Cannot create conversation with yourself') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const userId = req.userId;

    const conversations = await conversationService.getConversations(userId);

    res.json({
      success: true,
      message: 'Chat list retrieved successfully',
      data: conversations,
      count: conversations.length
    });
  } catch (error) {
    next(error);
  }
};

const getConversationById = async (req, res, next) => {
  try {
    const conversationId = parseInt(req.params.id);
    const userId = req.userId;

    const conversation = await conversationService.getConversationById(conversationId, userId);

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    if (error.message === 'Conversation not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversationById
};
