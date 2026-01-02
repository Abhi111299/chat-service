const { sequelize } = require('../models');

const migrate = async () => {
  try {
    console.log('Running migrations...');
    await sequelize.sync({ force: false, alter: true });
    console.log('Migrations completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();

