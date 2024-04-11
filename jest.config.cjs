/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/**/*.(test).*"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  coverageDirectory: "./coverage",
  moduleNameMapper: {
    "(.+)\\.js": "$1",
  },
};
