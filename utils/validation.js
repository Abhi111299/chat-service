const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  role: z.enum(['user', 'admin']).optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const createConversationSchema = z.object({
  userBId: z.number().int().positive('Invalid user ID')
});

const createMessageSchema = z.object({
  conversationId: z.number().int().positive('Invalid conversation ID'),
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long')
});

const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  cursor: z.string().optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  createConversationSchema,
  createMessageSchema,
  paginationSchema
};

