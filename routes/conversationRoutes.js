const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { createConversationSchema } = require('../utils/validation');

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Create a new conversation or get existing one
 *     description: Creates a new conversation with another user. If a conversation already exists, returns the existing one.
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userBId
 *             properties:
 *               userBId:
 *                 type: integer
 *                 description: ID of the user to start conversation with
 *                 example: 2
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Conversation created successfully
 *                 conversation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userAId:
 *                       type: integer
 *                       example: 1
 *                     userBId:
 *                       type: integer
 *                       example: 2
 *                     userA:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                     userB:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       200:
 *         description: Conversation already exists
 *       400:
 *         description: Cannot create conversation with yourself
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.post('/', authenticate, validate(createConversationSchema), conversationController.createConversation);

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get chat list for authenticated user
 *     description: Returns a list of all conversations for the authenticated user, including last message and unread count
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Chat list retrieved successfully
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       otherUser:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 2
 *                           name:
 *                             type: string
 *                             example: John Doe
 *                           email:
 *                             type: string
 *                             example: john@example.com
 *                       lastMessage:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 10
 *                           content:
 *                             type: string
 *                             example: Hello, how are you?
 *                           senderId:
 *                             type: integer
 *                             example: 2
 *                           isSeen:
 *                             type: boolean
 *                             example: false
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: 2024-01-01T12:00:00.000Z
 *                       unreadCount:
 *                         type: integer
 *                         example: 3
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-01-01T12:00:00.000Z
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-01-01T10:00:00.000Z
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/', authenticate, conversationController.getConversations);

/**
 * @swagger
 * /api/conversations/{id}:
 *   get:
 *     summary: Get conversation by ID
 *     description: Returns details of a specific conversation that the authenticated user is part of
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Conversation ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userAId:
 *                       type: integer
 *                       example: 1
 *                     userBId:
 *                       type: integer
 *                       example: 2
 *                     userA:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                     userB:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Conversation not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/:id', authenticate, conversationController.getConversationById);

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   get:
 *     summary: Get messages for a conversation
 *     description: Returns paginated messages for a specific conversation with cursor-based pagination
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Conversation ID
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of messages to retrieve
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: integer
 *         description: Cursor for pagination (message ID to fetch messages before)
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       conversationId:
 *                         type: integer
 *                         example: 1
 *                       senderId:
 *                         type: integer
 *                         example: 2
 *                       content:
 *                         type: string
 *                         example: Hello, how are you?
 *                       isSeen:
 *                         type: boolean
 *                         example: false
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       sender:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           email:
 *                             type: string
 *                           name:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *                     nextCursor:
 *                       type: integer
 *                       nullable: true
 *                       example: 10
 *                     limit:
 *                       type: integer
 *                       example: 20
 *       404:
 *         description: Conversation not found or access denied
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/:id/messages', authenticate, require('../controllers/messageController').getConversationMessages);

module.exports = router;

