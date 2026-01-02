const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { createMessageSchema } = require('../utils/validation');

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a new message
 *     description: Creates and sends a new message in a conversation. The message will be broadcast to all participants via Socket.IO
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - content
 *             properties:
 *               conversationId:
 *                 type: integer
 *                 description: ID of the conversation
 *                 example: 1
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 description: Message content
 *                 example: Hello, how are you?
 *     responses:
 *       201:
 *         description: Message created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Message created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     conversationId:
 *                       type: integer
 *                       example: 1
 *                     senderId:
 *                       type: integer
 *                       example: 1
 *                     content:
 *                       type: string
 *                       example: Hello, how are you?
 *                     isSeen:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     sender:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *       404:
 *         description: Conversation not found or access denied
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.post('/', authenticate, validate(createMessageSchema), messageController.createMessage);

module.exports = router;

