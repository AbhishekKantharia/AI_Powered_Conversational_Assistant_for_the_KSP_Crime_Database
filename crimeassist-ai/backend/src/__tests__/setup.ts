import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(__dirname, '../../.env') })

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
process.env.DB_HOST = 'localhost'
process.env.DB_PORT = '5432'
process.env.DB_NAME = 'crimeassist_test'
process.env.DB_USER = 'test_user'
process.env.DB_PASSWORD = 'test_password'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.CORS_ORIGIN = 'http://localhost:3000'

// Increase timeout for all tests
jest.setTimeout(30000)

// Suppress console output during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}
