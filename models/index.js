const sequelize = require('../config/database');
const User = require('./User');
const Conversation = require('./Conversation');
const Message = require('./Message');
const UserProfileImage = require('./UserProfileImage');
const RefreshToken = require('./RefreshToken');

// Define associations
User.hasMany(Conversation, { foreignKey: 'userAId', as: 'conversationsAsA' });
User.hasMany(Conversation, { foreignKey: 'userBId', as: 'conversationsAsB' });
Conversation.belongsTo(User, { foreignKey: 'userAId', as: 'userA' });
Conversation.belongsTo(User, { foreignKey: 'userBId', as: 'userB' });

Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

User.hasMany(UserProfileImage, { foreignKey: 'userId', as: 'profileImages' });
UserProfileImage.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Conversation,
  Message,
  UserProfileImage,
  RefreshToken
};

