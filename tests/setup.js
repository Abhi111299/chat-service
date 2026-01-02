// Test setup file
// This file runs before all tests

// Increase timeout for database operations
jest.setTimeout(40000);

// Suppress console logs during tests (optional)
if (process.env.NODE_ENV === 'test') {
  // Uncomment to suppress logs
  // global.console = {
  //   ...console,
  //   log: jest.fn(),
  //   debug: jest.fn(),
  //   info: jest.fn(),
  //   warn: jest.fn(),
  //   error: jest.fn(),
  // };
}

