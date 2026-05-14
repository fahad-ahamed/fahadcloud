/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }] },
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/standalone/"],
  modulePathIgnorePatterns: ["/node_modules/", "/.next/", "/standalone/"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  testTimeout: 30000,
};
