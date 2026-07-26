const https = require('https');

const BASE = 'https://project-rainfall-60072881979.development.catalystserverless.in/server/api-function';

let TOKEN = '';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': TOKEN,
      },
    };
    const req = https.request(opts, (res) => {
      let chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const districts = [
  'd0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000022',
  'd0000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000012',
  'd0000000-0000-0000-0000-000000000011',
];

const stationsByDistrict = {
  'd0000000-0000-0000-0000-000000000004': [
    'f0000000-0000-0000-0000-000000000009',
    'f0000000-0000-0000-0000-000000000010',
    'f0000000-0000-0000-0000-000000000011',
  ],
  'd0000000-0000-0000-0000-000000000022': [
    'f0000000-0000-0000-0000-000000000064',
    'f0000000-0000-0000-0000-000000000065',
  ],
  'd0000000-0000-0000-0000-000000000003': [
    'f0000000-0000-0000-0000-000000000006',
    'f0000000-0000-0000-0000-000000000007',
  ],
  'd0000000-0000-0000-0000-000000000012': [
    'f0000000-0000-0000-0000-000000000034',
  ],
  'd0000000-0000-0000-0000-000000000011': [
    'f0000000-0000-0000-0000-000000000031',
  ],
};

const officers = [
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pad(n) { return String(n).padStart(2, '0'); }

function dateStr(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}T${pad(randInt(8,22))}:${pad(randInt(0,59))}:00.000Z`;
}

const categories = ['murder','robbery','burglary','theft','fraud','cybercrime','assault','kidnapping','drug_offense','arms_offense','property_crime','economic_offense','accident'];
const locations = ['MG Road','Koramangala 5th Block','Whitefield Main Road','Jayanagar 4th Block','HSR Layout','Indiranagar','BTM Layout','Electronic City','Marathahalli','Hebbal','Banashankari','Rajajinagar','Malleshwaram','Basavanagudi','JP Nagar'];
const names = ['Rajesh Kumar','Priya Sharma','Mohammed Ali','Lakshmi Devi','Suresh Patel','Anita Rao','Venkat Reddy','Geeta Kumari','Arun Sharma','Meena Bai','Padma','Shankar','Girija','Nagaraj','Savita','Vijayalakshmi','Renuka','Prasad','Vasanthi','Deepa','Rahul Verma','Kavitha Nair','Deepak Joshi','Sunitha Devi','Rajendra Prasad'];

async function main() {
  // Login
  console.log('Logging in...');
  const loginResp = await request('POST', '/auth/login', { username: 'admin', password: 'password' });
  if (loginResp.status !== 200) { console.error('Login failed:', loginResp); return; }
  TOKEN = loginResp.data.data.accessToken;
  console.log('Login OK');

  // 1. Create criminals (15)
  console.log('\nCreating criminals...');
  const criminalData = [
    { fullName: 'Ravi Shankar Gowda', riskLevel: 'high', isWanted: true, crimeSpecialization: ['murder','robbery'], modusOperandi: 'Armed robber targeting jewelry stores', address: 'Bengaluru', districtId: districts[0] },
    { fullName: 'Sunil Kumar', riskLevel: 'critical', isWanted: true, crimeSpecialization: ['cybercrime','fraud'], modusOperandi: 'Online phishing and bank fraud', address: 'Mysuru', districtId: districts[1] },
    { fullName: 'Prakash Menon', riskLevel: 'medium', crimeSpecialization: ['theft','burglary'], modusOperandi: 'Break-in specialist targeting residential areas', address: 'Belagavi', districtId: districts[2] },
    { fullName: 'Manjunath Shetty', riskLevel: 'high', isWanted: true, crimeSpecialization: ['drug_offense'], modusOperandi: 'Drug distribution network across coastal Karnataka', address: 'Mangaluru', districtId: districts[4] },
    { fullName: 'Ashraf Khan', riskLevel: 'medium', crimeSpecialization: ['fraud','economic_offense'], modusOperandi: 'Property fraud and document forgery', address: 'Davanagere', districtId: districts[3] },
    { fullName: 'Vijay Patel', riskLevel: 'low', crimeSpecialization: ['theft'], modusOperandi: 'Petty theft from commercial establishments', address: 'Bengaluru', districtId: districts[0] },
    { fullName: 'Raju Gouda', riskLevel: 'high', isWanted: true, crimeSpecialization: ['kidnapping','robbery'], modusOperandi: 'Kidnapping for ransom', address: 'Kalaburagi', districtId: districts[0] },
    { fullName: 'Imran Sheikh', riskLevel: 'medium', crimeSpecialization: ['arms_offense'], modusOperandi: 'Illegal arms trafficking', address: 'Bengaluru', districtId: districts[0] },
    { fullName: 'Kiran Kumar', riskLevel: 'low', crimeSpecialization: ['property_crime'], modusOperandi: 'Vandalism and property damage', address: 'Mysuru', districtId: districts[1] },
    { fullName: 'Sanjay Yadav', riskLevel: 'critical', isWanted: true, crimeSpecialization: ['murder','assault'], modusOperandi: ' violent assault with weapons', address: 'Belagavi', districtId: districts[2] },
    { fullName: 'Deepak Singh', riskLevel: 'medium', crimeSpecialization: ['accident'], modusOperandi: 'Hit and run incidents', address: 'Davanagere', districtId: districts[3] },
    { fullName: 'Mohan Das', riskLevel: 'low', crimeSpecialization: ['fraud'], modusOperandi: 'Small-scale check bouncing', address: 'Mangaluru', districtId: districts[4] },
    { fullName: 'Ramesh Babu', riskLevel: 'high', isWanted: true, crimeSpecialization: ['cybercrime','fraud'], modusOperandi: 'UPI payment fraud and SIM swap attacks', address: 'Bengaluru', districtId: districts[0] },
    { fullName: 'Suresh Reddy', riskLevel: 'medium', crimeSpecialization: ['drug_offense','arms_offense'], modusOperandi: 'Drug and weapon supply chain', address: 'Mysuru', districtId: districts[1] },
    { fullName: 'Javed Ahmed', riskLevel: 'high', crimeSpecialization: ['burglary','theft'], modusOperandi: 'Night-time residential burglary', address: 'Belagavi', districtId: districts[2] },
  ];

  for (const c of criminalData) {
    const r = await request('POST', '/criminals', c);
    if (r.status === 201) console.log(`  Created: ${c.fullName}`);
    else console.log(`  Failed: ${c.fullName} -> ${r.status} ${JSON.stringify(r.data.error || r.data)}`);
  }

  // 2. Create FIR (20)
  console.log('\nCreating FIR...');
  const firIds = [];
  for (let i = 0; i < 20; i++) {
    const distId = pick(districts);
    const stId = pick(stationsByDistrict[distId]);
    const cat = pick(categories);
    const month = randInt(1, 12);
    const year = month > 6 ? 2026 : 2025;
    const body = {
      stationId: stId,
      districtId: distId,
      complainantName: pick(names),
      complainantPhone: `9${randInt(400000000, 999999999)}`,
      incidentDate: dateStr(year, month, randInt(1, 28)),
      incidentLocation: `Near ${pick(locations)}, Bengaluru`,
      crimeCategory: cat,
      crimeDescription: `${cat.replace(/_/g, ' ')} incident reported in residential area. Victim reported ${randInt(1, 5)} perpetrators involved. ${pick(['Night-time','Daytime','Early morning','Late evening'])} incident.`,
      ipcSections: [`IPC ${pick(['302','304','307','376','379','380','392','395','420','498A','506','34','120B'])}`],
      accusedKnown: Math.random() > 0.5,
    };
    const r = await request('POST', '/fir', body);
    if (r.status === 201) {
      const firId = r.data.data?.id || r.data.data?.firId;
      firIds.push(firId);
      console.log(`  Created FIR #${i + 1}: ${cat} (${r.data.data?.firNumber || firId})`);
    } else {
      console.log(`  Failed FIR #${i + 1}: ${r.status} ${JSON.stringify(r.data.error || r.data)}`);
    }
  }

  // 3. Create cases (15) linked to FIRs
  console.log('\nCreating cases...');
  for (let i = 0; i < Math.min(15, firIds.length); i++) {
    const distId = pick(districts);
    const stId = pick(stationsByDistrict[distId]);
    const cat = pick(categories);
    const month = randInt(1, 12);
    const year = month > 6 ? 2026 : 2025;
    const body = {
      firId: firIds[i],
      title: `${cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Case - ${pick(['Bengaluru','Mysuru','Belagavi','Davanagere','Mangaluru'])}`,
      description: `Investigation into ${cat.replace(/_/g, ' ')} incident. Multiple witnesses identified. ${pick(['Evidence collected','Forensic analysis pending','CCTV footage under review','Suspect identified'])}.`,
      crimeCategory: cat,
      priority: randInt(1, 5),
      districtId: distId,
      stationId: stId,
      assignedOfficerId: pick(officers),
      incidentDate: dateStr(year, month, randInt(1, 28)),
      ipcSections: [`IPC ${pick(['302','304','307','376','379','380','392','395','420','498A','506'])}`],
    };
    const r = await request('POST', '/cases', body);
    if (r.status === 201) console.log(`  Created case #${i + 1}: ${body.title}`);
    else console.log(`  Failed case #${i + 1}: ${r.status} ${JSON.stringify(r.data.error || r.data)}`);
  }

  console.log('\nDone!');
}

main().catch(console.error);
