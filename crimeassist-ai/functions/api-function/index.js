const path = require('path');

// Set working directory
process.chdir(path.join(__dirname, 'backend'));

// Load environment variables
try { require('dotenv').config(); } catch(e) {}

// Import the Express app from the compiled Catalyst entry point
const app = require('./backend/catalyst');

module.exports = app;
