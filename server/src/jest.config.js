module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapping: {
    '^src/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
