const catalyst = require('zcatalyst-sdk-node');

module.exports = async (req, res) => {
  const app = catalyst.initialize(req);

  try {
    const { username, password } = req.body;
    
    // Catalyst Authentication logic
    if (username && password) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'success',
        message: 'Authenticated via Zoho Catalyst Cloud Function',
        token: 'catalyst_jwt_token_sample',
        user: { username, role: 'investigation_officer' }
      }));
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: 'Missing credentials' }));
    }
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'error', message: error.message }));
  }
};
