const path = require('path');

// Load environment variables from .env file in this directory
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch(e) {}

// Import the Express app from the bundled entry point (all deps included)
const app = require('./catalyst.bundle');

module.exports = app;
