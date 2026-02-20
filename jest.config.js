// jest.config.js

module.exports = {
  testEnvironment: "jsdom",

  // Coverage settings
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/*.spec.js",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json-summary"],

  // Test file patterns
  testMatch: ["<rootDir>/test/**/*.test.js", "<rootDir>/test/**/*.spec.js"],

  // Setup file (our Apple Pay test harness)
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],

  // Module resolution
  moduleFileExtensions: ["js", "json"],

  // Global settings
  globals: {
    window: true,
  },

  // Timeout for tests
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
};
