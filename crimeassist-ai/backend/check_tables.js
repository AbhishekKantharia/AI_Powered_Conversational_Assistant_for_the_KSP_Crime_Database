const {Pool} = require('pg');
const p = new Pool({connectionString: 'postgresql://neondb_owner:npg_adBUIRGf1vs2@ep-dark-term-azppfafv-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'});
p.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
  .then(r => {
    const tables = r.rows.map(x=>x.table_name);
    console.log('All tables:', tables.join(', '));
    const chat = tables.filter(t=>t.includes('chat'));
    console.log('Chat tables:', chat);
  })
  .catch(e=>console.error(e))
  .finally(()=>p.end());
