const { sequelize } = require('../models');

const reset = async () => {
  try {
    console.log('Resetting database...');
    await sequelize.sync({ force: true });
    console.log('Database reset completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Database reset failed:', error);
    process.exit(1);
  }
};

reset();

