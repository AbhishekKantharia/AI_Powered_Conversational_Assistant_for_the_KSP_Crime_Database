import { connectDB, query, disconnectDB } from '../services/database.service'
import bcrypt from 'bcryptjs'
import { logger } from './logger'

const DISTRICTS = [
  { name: 'Bengaluru Urban', code: 'BNU', lat: 12.9716, lng: 77.5946 },
  { name: 'Mysuru', code: 'MYS', lat: 12.2958, lng: 76.6394 },
  { name: 'Hubballi-Dharwad', code: 'HBD', lat: 15.3647, lng: 75.124 },
  { name: 'Mangaluru', code: 'MNG', lat: 12.9141, lng: 74.856 },
  { name: 'Belagavi', code: 'BLG', lat: 15.8497, lng: 74.4977 },
  { name: 'Kalaburagi', code: 'KLB', lat: 17.3297, lng: 76.8343 },
  { name: 'Ballari', code: 'BLR', lat: 15.1394, lng: 76.9214 },
  { name: 'Shivamogga', code: 'SMG', lat: 13.9299, lng: 75.5681 },
  { name: 'Tumakuru', code: 'TMK', lat: 13.3379, lng: 77.1173 },
  { name: 'Udupi', code: 'UDP', lat: 13.3409, lng: 74.7421 },
]

const STATIONS = [
  'Central Silk Board Police Station',
  'Indiranagar Police Station',
  'Devaraja Police Station',
  'Kadri Police Station',
  'Camp Police Station',
  'Subhash Nagar Police Station',
  'Vidhana Soudha Police Station',
  'Koramangala Police Station',
]

const CRIME_CATEGORIES = [
  'cybercrime',
  'robbery',
  'burglary',
  'theft',
  'fraud',
  'assault',
  'kidnapping',
  'drug_offense',
]

export async function seedDatabase() {
  logger.info('Starting Karnataka State Police Database Seed Process...')
  await connectDB()

  try {
    // 1. Seed Districts
    const districtIds: string[] = []
    for (const d of DISTRICTS) {
      const res = await query(
        `INSERT INTO districts (name, code, latitude, longitude)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
         RETURNING id`,
        [d.name, d.code, d.lat, d.lng]
      )
      districtIds.push(res.rows[0].id as string)
    }
    logger.info(`Seeded ${districtIds.length} Districts`)

    // 2. Seed Police Stations
    const stationIds: string[] = []
    for (let i = 0; i < STATIONS.length; i++) {
      const distId = districtIds[i % districtIds.length]
      const res = await query(
        `INSERT INTO police_stations (name, code, district_id, phone)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (code) DO UPDATE SET updated_at = NOW()
         RETURNING id`,
        [STATIONS[i], `PS-${100 + i}`, distId, `080-2294${2000 + i}`]
      )
      stationIds.push(res.rows[0].id as string)
    }
    logger.info(`Seeded ${stationIds.length} Police Stations`)

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
    logger.info('Seeded Admin & Officer Users')

    // 4. Seed 200 Criminal Profiles
    logger.info('Seeding 200 Criminal Profiles...')
    for (let i = 1; i <= 200; i++) {
      const crId = `KSP-CR-2026-${String(i).padStart(4, '0')}`
      const isWanted = i <= 30
      const riskLevel = i <= 15 ? 'critical' : i <= 45 ? 'high' : i <= 100 ? 'medium' : 'low'
      const riskScore = i <= 15 ? 90 + (i % 10) : i <= 45 ? 75 + (i % 15) : 50

      await query(
        `INSERT INTO criminals (criminal_id, full_name, aliases, age, gender, risk_level, risk_score, is_wanted, reward_amount, district_id, modus_operandi, crime_specialization)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (criminal_id) DO NOTHING`,
        [
          crId,
          `Criminal Suspect ${i}`,
          [`Alias_${i}`, `Vicky_${i}`],
          22 + (i % 30),
          i % 10 === 0 ? 'female' : 'male',
          riskLevel,
          riskScore,
          isWanted,
          isWanted ? 50000 + i * 1000 : null,
          districtIds[i % districtIds.length],
          `Standard modus operandi for criminal pattern ${i}`,
          [CRIME_CATEGORIES[i % CRIME_CATEGORIES.length]],
        ]
      )
    }
    logger.info('Seeded 200 Criminal Profiles successfully')

    // 5. Seed 1000 FIR Records
    logger.info('Seeding 1000 FIR Records...')
    for (let i = 1; i <= 1000; i++) {
      const firNum = `FIR/KSP/2026/${String(i).padStart(5, '0')}`
      const category = CRIME_CATEGORIES[i % CRIME_CATEGORIES.length]
      const status = i % 4 === 0 ? 'chargesheeted' : i % 3 === 0 ? 'under_investigation' : 'filed'

      await query(
        `INSERT INTO fir (fir_number, station_id, district_id, complainant_name, incident_date, incident_location, crime_category, crime_description, ipc_sections, status, registered_by)
         VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${i} hours', $5, $6, $7, $8, $9, $10)
         ON CONFLICT (fir_number) DO NOTHING`,
        [
          firNum,
          stationIds[i % stationIds.length],
          districtIds[i % districtIds.length],
          `Complainant ${i}`,
          `Location Point ${i}, Karnataka`,
          category,
          `Detailed crime description incident report for FIR #${i}. Involved property loss and suspicious activity.`,
          ['IPC 420', 'IPC 379'],
          status,
          officerUser.rows[0].id,
        ]
      )
    }
    logger.info('Seeded 1000 FIR Records successfully')

    // 6. Seed 500 Cases
    logger.info('Seeding 500 Case Files...')
    for (let i = 1; i <= 500; i++) {
      const caseNum = `KSP-2026-${String(i).padStart(4, '0')}`
      const category = CRIME_CATEGORIES[i % CRIME_CATEGORIES.length]
      const status = i % 5 === 0 ? 'closed' : i % 3 === 0 ? 'under_investigation' : 'registered'

      await query(
        `INSERT INTO cases (case_number, title, description, crime_category, status, priority, district_id, station_id, assigned_officer_id, ai_risk_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (case_number) DO NOTHING`,
        [
          caseNum,
          `Investigation of ${category} Incident #${i}`,
          `Case file detailing investigation process for incident #${i}`,
          category,
          status,
          (i % 5) + 1,
          districtIds[i % districtIds.length],
          stationIds[i % stationIds.length],
          officerUser.rows[0].id,
          40 + (i % 55),
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
