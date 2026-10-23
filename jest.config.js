const path = require('path');

const posix = (p) => p.replace(/\\/g, '/');

module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/assets/(.*)$': posix(path.join(__dirname, 'assets', '$1')),
    '^@/(.*)$': posix(path.join(__dirname, 'src', '$1')),
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|expo-router|@react-navigation/.*|zustand|react-native-markdown-display))',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/app/**'],
};
