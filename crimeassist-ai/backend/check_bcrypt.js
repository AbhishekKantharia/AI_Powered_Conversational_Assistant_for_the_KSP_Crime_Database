const bcrypt = require('bcryptjs');
const hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
bcrypt.compare('password', hash).then(r => console.log('bcryptjs match:', r));
