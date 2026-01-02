const messageService = require('../services/messageService');

const createMessage = async (req, res, next) => {
  try {
    const { conversationId, content } = req.validated;
    const senderId = req.userId;

    const message = await messageService.createMessage(conversationId, senderId, content);

    res.status(201).json({
      success: true,
      message: 'Message created successfully',
      data: message
    });
  } catch (error) {
    if (error.message === 'Conversation not found or access denied') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

const getConversationMessages = async (req, res, next) => {
  try {
    const conversationId = parseInt(req.params.id);
    const userId = req.userId;
    const { limit = 20, cursor } = req.query || {};

    const result = await messageService.getConversationMessages(conversationId, userId, {
      limit,
      cursor
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error.message === 'Conversation not found or access denied') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  createMessage,
  getConversationMessages
};
