const path = require('path')

module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '@unrest/geo': path.resolve(__dirname, '../../Geo/dist/index.js'),
    '^@/(.*)$':  '<rootDir>/src/$1',
  }
}

