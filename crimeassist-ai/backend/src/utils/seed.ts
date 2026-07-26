import { connectDB, query, disconnectDB } from '../services/database.service'
import bcrypt from 'bcryptjs'
import { logger } from './logger'

// Real Karnataka districts based on Census 2011 / NCRB published data
const DISTRICTS = [
  { name: 'Bengaluru Urban', code: 'BNU', lat: 12.9716, lng: 77.5946, population: 9621551, area: 741 },
  { name: 'Mysuru', code: 'MYS', lat: 12.2958, lng: 76.6394, population: 3001127, area: 6854 },
  { name: 'Hubballi-Dharwad', code: 'HBD', lat: 15.3647, lng: 75.124, population: 1618520, area: 7657 },
  { name: 'Mangaluru', code: 'MNG', lat: 12.9141, lng: 74.856, population: 2015720, area: 4526 },
  { name: 'Belagavi', code: 'BLG', lat: 15.8497, lng: 74.4977, population: 4779661, area: 13415 },
  { name: 'Kalaburagi', code: 'KLB', lat: 17.3297, lng: 76.8343, population: 2566326, area: 10990 },
  { name: 'Ballari', code: 'BLR', lat: 15.1394, lng: 76.9214, population: 2523406, area: 8450 },
  { name: 'Shivamogga', code: 'SMG', lat: 13.9299, lng: 75.5681, population: 1755512, area: 8477 },
  { name: 'Tumakuru', code: 'TMK', lat: 13.3379, lng: 77.1173, population: 2681449, area: 10597 },
  { name: 'Udupi', code: 'UDP', lat: 13.3409, lng: 74.7421, population: 1177907, area: 3879 },
  { name: 'Davangere', code: 'DVG', lat: 14.4644, lng: 75.9218, population: 1945497, area: 8440 },
  { name: 'Chitradurga', code: 'CTR', lat: 14.2307, lng: 76.3988, population: 1517896, area: 8440 },
  { name: 'Hassan', code: 'HAS', lat: 13.0067, lng: 76.098, population: 1776421, area: 6814 },
  { name: 'Mandya', code: 'MDY', lat: 12.5218, lng: 76.8951, population: 1805764, area: 4402 },
  { name: 'Raichur', code: 'RCR', lat: 16.2120, lng: 77.3438, population: 1928812, area: 6826 },
  { name: 'Bidar', code: 'BDR', lat: 17.9133, lng: 77.3189, population: 1703329, area: 5448 },
  { name: 'Vijayapura', code: 'VJP', lat: 16.8302, lng: 75.7100, population: 2177331, area: 10530 },
  { name: 'Chikkaballapura', code: 'CKB', lat: 13.4359, lng: 77.7275, population: 1255104, area: 4244 },
  { name: 'Kolar', code: 'KLR', lat: 13.1370, lng: 78.1295, population: 1536401, area: 3969 },
  { name: 'Kodagu', code: 'KDG', lat: 12.4208, lng: 75.7463, population: 548561, area: 4102 },
  { name: 'Chikkamagaluru', code: 'CMG', lat: 13.3158, lng: 75.7769, population: 1140906, area: 7201 },
  { name: 'Bagalkot', code: 'BGK', lat: 16.1808, lng: 75.6965, population: 1889752, area: 6583 },
  { name: 'Gadag', code: 'GDG', lat: 15.4045, lng: 75.6299, population: 1065235, area: 4651 },
  { name: 'Koppal', code: 'KPL', lat: 15.3526, lng: 76.2283, population: 1389920, area: 5570 },
  { name: 'Chamarajanagar', code: 'CMR', lat: 11.9237, lng: 76.9443, population: 1020299, area: 5106 },
  { name: 'Yadgir', code: 'YDG', lat: 16.7712, lng: 77.1164, population: 1174271, area: 5273 },
  { name: 'Ramanagara', code: 'RMN', lat: 12.7224, lng: 77.2813, population: 1082764, area: 3534 },
]

// Realistic police stations for Karnataka districts
const STATIONS: Record<string, string[]> = {
  'Bengaluru Urban': [
    'Koramangala Police Station', 'Indiranagar Police Station', 'Whitefield Police Station',
    'HSR Layout Police Station', 'Jayanagar Police Station', 'Basavanagudi Police Station',
    'Malleshwaram Police Station', 'Rajajinagar Police Station',
  ],
  'Mysuru': ['Devaraja Police Station', 'Lakshmipuram Police Station', 'Vani Vilas Mohalla PS', 'Saraswathipuram Police Station'],
  'Mangaluru': ['Kadri Police Station', 'Mangaluru South Police Station', 'Surathkal Police Station'],
  'Hubballi-Dharwad': ['Hubballi Town Police Station', 'Dharwad Police Station', 'Kalghatagi Police Station'],
  'Belagavi': ['Camp Police Station', 'Belagavi Tilakwadi PS', 'Sadar Police Station'],
  default: ['Central Police Station', 'Town Police Station', 'Rural Police Station'],
}

const firstNames = ['Ravi', 'Suresh', 'Mahesh', 'Rajesh', 'Sunil', 'Kumar', 'Vinod', 'Arun', 'Deepak', 'Sanjay', 'Anil', 'Manoj', 'Vijay', 'Prasad', 'Raju']
const lastNames = ['Sharma', 'Kumar', 'Singh', 'Naik', 'Reddy', 'Patil', 'Gowda', 'Nair', 'Rao', 'Hegde']

const CRIME_CATEGORIES = [
  'cybercrime', 'robbery', 'burglary', 'theft', 'fraud',
  'assault', 'kidnapping', 'drug_offense', 'murder', 'property_crime',
]

// Realistic IPC section combinations by crime category
const IPC_BY_CATEGORY: Record<string, string[]> = {
  cybercrime: ['IPC 420', 'IPC 468', 'IPC 471', 'IPC 66D IT Act', 'IPC 66C IT Act'],
  robbery: ['IPC 392', 'IPC 394', 'IPC 395', 'IPC 397', 'IPC 398'],
  burglary: ['IPC 380', 'IPC 457', 'IPC 458', 'IPC 461'],
  theft: ['IPC 379', 'IPC 380', 'IPC 411', 'IPC 378'],
  fraud: ['IPC 420', 'IPC 468', 'IPC 471', 'IPC 406'],
  assault: ['IPC 323', 'IPC 324', 'IPC 325', 'IPC 326', 'IPC 147'],
  kidnapping: ['IPC 363', 'IPC 364', 'IPC 365', 'IPC 366'],
  drug_offense: ['NDPS Act Sec 20', 'NDPS Act Sec 21', 'NDPS Act Sec 29'],
  murder: ['IPC 302', 'IPC 304', 'IPC 307', 'IPC 120B'],
  property_crime: ['IPC 447', 'IPC 448', 'IPC 426', 'IPC 427'],
}

export async function seedDatabase() {
  logger.info('Starting Karnataka State Police Database Seed Process...')
  await connectDB()

  try {
    // 1. Seed Districts with real data
    const districtIds: string[] = []
    for (const d of DISTRICTS) {
      const res = await query(
        `INSERT INTO districts (name, code, latitude, longitude, population, area_sq_km, headquarters, division)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (name) DO UPDATE SET
           latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
           population = EXCLUDED.population, area_sq_km = EXCLUDED.area_sq_km,
           updated_at = NOW()
         RETURNING id`,
        [d.name, d.code, d.lat, d.lng, d.population, d.area, d.name.split(' ')[0], 'Karnataka']
      )
      districtIds.push(res.rows[0].id as string)
    }
    logger.info(`Seeded ${districtIds.length} Districts with real Karnataka data`)

    // 2. Seed Police Stations (realistic for each district)
    const stationIds: string[] = []
    let stationCount = 0
    for (let i = 0; i < DISTRICTS.length; i++) {
      const distId = districtIds[i]
      const distName = DISTRICTS[i].name
      const stationList = STATIONS[distName] || STATIONS.default

      for (let j = 0; j < stationList.length; j++) {
        const code = `PS-${String(stationCount + 1).padStart(3, '0')}`
        const res = await query(
          `INSERT INTO police_stations (name, code, district_id, phone)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (code) DO UPDATE SET updated_at = NOW()
           RETURNING id`,
          [stationList[j], code, distId, `080-${2000 + i}${100 + j}`]
        )
        stationIds.push(res.rows[0].id as string)
        stationCount++
      }
    }
    logger.info(`Seeded ${stationCount} Police Stations`)

    // 3. Seed Users
    const passwordHash = await bcrypt.hash('password123', 10)
    const adminUser = await query(
      `INSERT INTO users (badge_number, username, email, password_hash, full_name, role, status, district_id, station_id)
       VALUES ('KSP-0001', 'admin_ksp', 'admin@ksp.gov.in', $1, 'Director General of Police', 'administrator', 'active', $2, $3)
       ON CONFLICT (username) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
      [passwordHash, districtIds[0], stationIds[0]]
    )
    const officerUser = await query(
      `INSERT INTO users (badge_number, username, email, password_hash, full_name, role, status, district_id, station_id)
       VALUES ('KSP-8821', 'officer_ksp', 'officer@ksp.gov.in', $1, 'Inspector Rajesh Kumar', 'investigation_officer', 'active', $2, $3)
       ON CONFLICT (username) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
      [passwordHash, districtIds[0], stationIds[0]]
    )
    const analystUser = await query(
      `INSERT INTO users (badge_number, username, email, password_hash, full_name, role, status, district_id, station_id)
       VALUES ('KSP-5500', 'analyst_ksp', 'analyst@ksp.gov.in', $1, 'Inspector Priya Sharma', 'crime_analyst', 'active', $2, $3)
       ON CONFLICT (username) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
      [passwordHash, districtIds[1], stationIds[Math.min(4, stationIds.length - 1)]]
    )
    logger.info('Seeded 3 Users (Admin, Officer, Analyst)')

    // 4. Seed 200 Criminal Profiles with realistic data
    logger.info('Seeding 200 Criminal Profiles...')
    for (let i = 1; i <= 200; i++) {
      const crId = `KSP-CR-2026-${String(i).padStart(4, '0')}`
      const isWanted = i <= 30
      const riskLevel = i <= 15 ? 'critical' : i <= 45 ? 'high' : i <= 100 ? 'medium' : 'low'
      const riskScore = i <= 15 ? 90 + (i % 10) : i <= 45 ? 75 + (i % 15) : 50
      const firstName = firstNames[i % firstNames.length]
      const lastName = lastNames[i % lastNames.length]
      const distIdx = i % DISTRICTS.length

      await query(
        `INSERT INTO criminals (criminal_id, full_name, aliases, age, gender, risk_level, risk_score, is_wanted, reward_amount, district_id, modus_operandi, crime_specialization)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (criminal_id) DO NOTHING`,
        [
          crId,
          `${firstName} ${lastName}`,
          [`${firstName} alias ${lastName}`, `Nickname_${i}`],
          22 + (i % 30),
          i % 10 === 0 ? 'female' : 'male',
          riskLevel,
          riskScore,
          isWanted,
          isWanted ? 50000 + i * 1000 : null,
          districtIds[distIdx],
          `Known for operating in ${DISTRICTS[distIdx].name} district. ${i % 3 === 0 ? 'Repeat offender with prior record.' : 'First-time suspect.'}`,
          [CRIME_CATEGORIES[i % CRIME_CATEGORIES.length]],
        ]
      )
    }
    logger.info('Seeded 200 Criminal Profiles')

    // 5. Seed 1000 FIR Records with realistic IPC sections and Karnataka locations
    logger.info('Seeding 1000 FIR Records with NCRB-aligned crime categories...')
    const locations = ['Bus Stand', 'Railway Station', 'Market Area', 'Residential Area', 'Commercial Complex', 'Highway', 'College Road', 'Hospital Road', 'Mall Parking', 'Temple Street']
    for (let i = 1; i <= 1000; i++) {
      const firNum = `FIR/KSP/2026/${String(i).padStart(5, '0')}`
      const category = CRIME_CATEGORIES[i % CRIME_CATEGORIES.length]
      const status = i % 4 === 0 ? 'chargesheeted' : i % 3 === 0 ? 'under_investigation' : 'filed'
      const distIdx = i % DISTRICTS.length
      const ipcSections = IPC_BY_CATEGORY[category] || ['IPC 420', 'IPC 379']
      const locationName = `${locations[i % locations.length]}, ${DISTRICTS[distIdx].name}`
      const daysAgo = i % 365

      await query(
        `INSERT INTO fir (fir_number, station_id, district_id, complainant_name, incident_date, incident_location, crime_category, crime_description, ipc_sections, status, registered_by)
         VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${daysAgo} days', $5, $6, $7, $8, $9, $10)
         ON CONFLICT (fir_number) DO NOTHING`,
        [
          firNum,
          stationIds[i % stationIds.length],
          districtIds[distIdx],
          `Complainant ${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
          locationName,
          category,
          `${category.replace(/_/g, ' ').toUpperCase()} incident reported near ${locationName}. ${i % 3 === 0 ? 'Multiple witnesses present.' : 'Under investigation.'}`,
          ipcSections,
          status,
          officerUser.rows[0].id,
        ]
      )
    }
    logger.info('Seeded 1000 FIR Records with real IPC sections')

    // 6. Seed 500 Cases
    logger.info('Seeding 500 Case Files...')
    for (let i = 1; i <= 500; i++) {
      const caseNum = `KSP-2026-${String(i).padStart(4, '0')}`
      const category = CRIME_CATEGORIES[i % CRIME_CATEGORIES.length]
      const status = i % 5 === 0 ? 'closed' : i % 3 === 0 ? 'under_investigation' : 'registered'
      const ipcSections = IPC_BY_CATEGORY[category] || ['IPC 420']
      const distIdx = i % DISTRICTS.length

      await query(
        `INSERT INTO cases (case_number, title, description, crime_category, status, priority, district_id, station_id, assigned_officer_id, ai_risk_score, ipc_sections)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (case_number) DO NOTHING`,
        [
          caseNum,
          `Investigation of ${category.replace(/_/g, ' ')} Incident in ${DISTRICTS[distIdx].name}`,
          `Case file for ${category.replace(/_/g, ' ')} incident #${i} in ${DISTRICTS[distIdx].name} district. ${i % 4 === 0 ? 'Linked to previous FIR.' : 'Independent investigation.'}`,
          category,
          status,
          (i % 5) + 1,
          districtIds[distIdx],
          stationIds[i % stationIds.length],
          officerUser.rows[0].id,
          40 + (i % 55),
          ipcSections,
        ]
      )
    }
    logger.info('Seeded 500 Case Files successfully')

    logger.info('✅ Complete KSP Database Seeding Finished Successfully!')
  } catch (err) {
    logger.error('Database seeding error:', err)
  } finally {
    await disconnectDB()
  }
}

if (require.main === module) {
  seedDatabase()
}
