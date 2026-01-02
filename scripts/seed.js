const { User, Conversation, Message, RefreshToken, UserProfileImage } = require('../models');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    console.log('Seeding database...');

    // Clear existing data
    await RefreshToken.destroy({ where: {} });
    await Message.destroy({ where: {} });
    await Conversation.destroy({ where: {} });
    await UserProfileImage.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create users
    const users = await User.bulkCreate([
      {
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        name: 'Admin User',
        role: 'admin'
      },
      {
        email: 'user1@example.com',
        password: await bcrypt.hash('user123', 10),
        name: 'John Doe',
        role: 'user'
      },
      {
        email: 'user2@example.com',
        password: await bcrypt.hash('user123', 10),
        name: 'Jane Smith',
        role: 'user'
      },
      {
        email: 'user3@example.com',
        password: await bcrypt.hash('user123', 10),
        name: 'Bob Johnson',
        role: 'user'
      }
    ]);

    console.log(`Created ${users.length} users`);

    // Create conversations
    const conversations = await Conversation.bulkCreate([
      {
        userAId: users[1].id, // John
        userBId: users[2].id  // Jane
      },
      {
        userAId: users[1].id, // John
        userBId: users[3].id  // Bob
      }
    ]);

    console.log(`Created ${conversations.length} conversations`);

    // Create messages
    const messages = await Message.bulkCreate([
      {
        conversationId: conversations[0].id,
        senderId: users[1].id,
        content: 'Hello Jane! How are you?',
        isSeen: false
      },
      {
        conversationId: conversations[0].id,
        senderId: users[2].id,
        content: 'Hi John! I\'m doing great, thanks for asking!',
        isSeen: true
      },
      {
        conversationId: conversations[0].id,
        senderId: users[1].id,
        content: 'That\'s wonderful to hear!',
        isSeen: false
      },
      {
        conversationId: conversations[1].id,
        senderId: users[1].id,
        content: 'Hey Bob, are you free this weekend?',
        isSeen: false
      },
      {
        conversationId: conversations[1].id,
        senderId: users[3].id,
        content: 'Yes, I should be free. What did you have in mind?',
        isSeen: true
      }
    ]);

    console.log(`Created ${messages.length} messages`);
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();

