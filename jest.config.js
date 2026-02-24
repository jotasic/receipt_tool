/** @type {import('jest').Config} */
module.exports = {
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(expo-sqlite|expo-modules-core|@expo|react-native|@react-native)/)',
  ],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Tests that require a native SQLite runtime (expo-sqlite) cannot run in a
  // Node.js Jest environment. Run these on a real device or emulator.
  testPathIgnorePatterns: [
    '/node_modules/',
    'services/database/__tests__/',          // require native expo-sqlite
    'services/database/migrations/__tests__/migrateDocumentTypes\\.test\\.ts',
    'components/__tests__/StyledText-test\\.js', // requires react-test-renderer + native
  ],
};
