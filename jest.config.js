module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/scripts/',
    '/config/'
  ],
  testMatch: [ '**/tests/**/*.test.js' ],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/scripts/**',
    '!**/config/**',
    '!server.js',
    '!jest.config.js'
  ],
  testTimeout: 40000,
  setupFilesAfterEnv: [ '<rootDir>/tests/setup.js' ]
};

