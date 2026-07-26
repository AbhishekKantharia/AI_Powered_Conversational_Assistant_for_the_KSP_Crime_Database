const {Pool} = require('pg');
const p = new Pool({connectionString: 'postgresql://neondb_owner:npg_adBUIRGf1vs2@ep-dark-term-azppfafv-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'});
Promise.all([
  p.query('SELECT id, username, role FROM users ORDER BY created_at'),
  p.query("SELECT table_name FROM information_schema.views WHERE table_schema='public'"),
  p.query("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'crime_category') ORDER BY enumsortorder"),
  p.query("SELECT id, name FROM districts LIMIT 5"),
]).then(([users,views,enums,dists]) => {
  console.log('USERS:');
  users.rows.forEach(u => console.log('  '+u.id+' | '+u.username+' | '+u.role));
  console.log('VIEWS:');
  views.rows.forEach(v => console.log('  '+v.table_name));
  console.log('CRIME_CATEGORIES:');
  enums.rows.forEach(e => console.log('  '+e.enumlabel));
  console.log('DISTRICTS:');
  dists.rows.forEach(d => console.log('  '+d.id+' | '+d.name));
}).catch(e=>console.error(e)).finally(()=>p.end());
