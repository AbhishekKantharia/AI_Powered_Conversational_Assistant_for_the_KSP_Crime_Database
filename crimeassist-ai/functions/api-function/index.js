const path = require('path');

// Load environment variables
try { require('dotenv').config(); } catch(e) {}

// Import the Express app from the compiled Catalyst entry point
const app = require('./catalyst');

module.exports = app;
