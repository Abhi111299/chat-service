const { User } = require('../models');
const { verifyAccessToken } = require('../utils/jwt');
const conversationService = require('../services/conversationService');
const messageService = require('../services/messageService');

const initializeSocket = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.substring(7);

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Join a conversation
    socket.on('join:conversation', async (conversationId) => {
      try {
        // Verify conversation access using service
        await conversationService.verifyConversationAccess(conversationId, socket.userId);

        socket.join(`conversation:${conversationId}`);
        socket.emit('joined:conversation', {
          success: true,
          conversationId
        });
      } catch (error) {
        socket.emit('error', {
          success: false,
          message: error.message || 'Failed to join conversation'
        });
      }
    });

    // Leave a conversation
    socket.on('leave:conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      socket.emit('left:conversation', {
        success: true,
        conversationId
      });
    });

    // Handle new message
    socket.on('message:new', async (data) => {
      try {
        const { conversationId, content } = data;

        if (!conversationId || !content) {
          return socket.emit('error', {
            success: false,
            message: 'conversationId and content are required'
          });
        }

        // Create message using service
        const message = await messageService.createMessage(
          conversationId,
          socket.userId,
          content
        );

        // Emit to all users in the conversation
        io.to(`conversation:${conversationId}`).emit('message:new', {
          success: true,
          data: {
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            content: message.content,
            isSeen: message.isSeen,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            sender: message.sender ? {
              id: message.sender.id,
              name: message.sender.name,
              email: message.sender.email
            } : null
          }
        });
      } catch (error) {
        socket.emit('error', {
          success: false,
          message: error.message || 'Failed to send message'
        });
      }
    });

    // Handle message seen
    socket.on('message:seen', async (data) => {
      try {
        const { messageId, conversationId } = data;

        if (!messageId || !conversationId) {
          return socket.emit('error', {
            success: false,
            message: 'messageId and conversationId are required'
          });
        }

        // Verify conversation access
        await conversationService.verifyConversationAccess(conversationId, socket.userId);

        // Find message and mark as seen
        const { Message } = require('../models');
        const message = await Message.findOne({
          where: { id: messageId, conversationId }
        });

        if (message && message.senderId !== socket.userId) {
          await message.update({ isSeen: true });

          io.to(`conversation:${conversationId}`).emit('message:seen', {
            success: true,
            data: {
              messageId,
              conversationId,
              seenBy: socket.userId,
              seenAt: new Date()
            }
          });
        } else {
          socket.emit('error', {
            success: false,
            message: 'Message not found or cannot mark own message as seen'
          });
        }
      } catch (error) {
        socket.emit('error', {
          success: false,
          message: error.message || 'Failed to mark message as seen'
        });
      }
    });

    // Handle typing indicator start
    socket.on('typing:start', (data) => {
      const { conversationId } = data;

      if (!conversationId) {
        return socket.emit('error', {
          success: false,
          message: 'conversationId is required'
        });
      }

      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        success: true,
        data: {
          userId: socket.userId,
          conversationId
        }
      });
    });

    // Handle typing indicator stop
    socket.on('typing:stop', (data) => {
      const { conversationId } = data;

      if (!conversationId) {
        return socket.emit('error', {
          success: false,
          message: 'conversationId is required'
        });
      }

      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        success: true,
        data: {
          userId: socket.userId,
          conversationId
        }
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
};

module.exports = initializeSocket;
