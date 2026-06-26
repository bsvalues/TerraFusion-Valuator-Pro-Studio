/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/integration/**/*.test.ts", "**/integration/**/*.test.js"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": ["babel-jest", { presets: ["@babel/preset-typescript"] }],
  },
  collectCoverageFrom: ["integration/**/*.ts", "!integration/**/*.d.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["./setup.js"],
  testTimeout: 30000,
  verbose: true,
};
