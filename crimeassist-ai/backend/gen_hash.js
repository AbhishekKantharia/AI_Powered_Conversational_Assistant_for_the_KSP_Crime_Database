const bcrypt = require('bcryptjs');

async function main() {
  const hash = await bcrypt.hash('password', 10);
  console.log('New bcryptjs hash:', hash);
  
  const match = await bcrypt.compare('password', hash);
  console.log('Verify:', match);
}
main();
