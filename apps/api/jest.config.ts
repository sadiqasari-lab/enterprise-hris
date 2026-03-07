export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@hris/database$': '<rootDir>/../../packages/database/index.ts',
    '^@hris/auth$':     '<rootDir>/../../packages/auth/index.ts',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  coverageThreshold: {
    global: { lines: 60, branches: 50, functions: 60 },
  },
  verbose: true,
};
