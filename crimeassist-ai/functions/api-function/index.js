const path = require('path');

// Set working directory to the bundled backend
process.chdir(path.join(__dirname, 'backend'));

// Load environment from Catalyst or .env
try { require('dotenv').config(); } catch(e) {}

const app = require('./backend/dist/server');

module.exports = app;
