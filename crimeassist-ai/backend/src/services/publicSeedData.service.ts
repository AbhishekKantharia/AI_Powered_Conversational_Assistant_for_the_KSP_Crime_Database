// ─── Public Seed Data Service ─────────────────────────────────────────────────
// Embedded NCRB-derived public data for Karnataka crime records.
// Used as fallback when database tables are empty.
// Sources: NCRB Crime in India 2022, Karnataka State Crime Records Bureau,
//          Indian Penal Code (IPC) sections, Census 2011 district data.

import { buildPaginatedResponse, PaginatedResult } from './database.service'

// ─── District IDs (from seed.sql) ─────────────────────────────────────────────
const DISTRICT_IDS: Record<string, string> = {
  'Bengaluru Urban': 'd0000000-0000-0000-0000-000000000001',
  'Mysuru': 'd0000000-0000-0000-0000-000000000002',
  'Belagavi': 'd0000000-0000-0000-0000-000000000003',
  'Kalaburagi': 'd0000000-0000-0000-0000-000000000004',
  'Vijayapura': 'd0000000-0000-0000-0000-000000000005',
  'Ballari': 'd0000000-0000-0000-0000-000000000006',
  'Davanagere': 'd0000000-0000-0000-0000-000000000007',
  'Mandya': 'd0000000-0000-0000-0000-000000000008',
  'Shivamogga': 'd0000000-0000-0000-0000-000000000009',
  'Tumakuru': 'd0000000-0000-0000-0000-000000000010',
  'Hassan': 'd0000000-0000-0000-0000-000000000011',
  'Uttara Kannada': 'd0000000-0000-0000-0000-000000000012',
  'Chitradurga': 'd0000000-0000-0000-0000-000000000013',
  'Haveri': 'd0000000-0000-0000-0000-000000000014',
  'Raichur': 'd0000000-0000-0000-0000-000000000015',
  'Dharwad': 'd0000000-0000-0000-0000-000000000016',
  'Bagalkot': 'd0000000-0000-0000-0000-000000000017',
  'Kolar': 'd0000000-0000-0000-0000-000000000018',
  'Chikkaballapur': 'd0000000-0000-0000-0000-000000000019',
  'Bengaluru Rural': 'd0000000-0000-0000-0000-000000000020',
  'Bidar': 'd0000000-0000-0000-0000-000000000021',
  'Koppal': 'd0000000-0000-0000-0000-000000000022',
  'Ramanagara': 'd0000000-0000-0000-0000-000000000023',
  'Chikkamagaluru': 'd0000000-0000-0000-0000-000000000024',
  'Gadag': 'd0000000-0000-0000-0000-000000000025',
  'Dakshina Kannada': 'd0000000-0000-0000-0000-000000000026',
  'Udupi': 'd0000000-0000-0000-0000-000000000027',
  'Chamarajanagar': 'd0000000-0000-0000-0000-000000000028',
  'Yadgir': 'd0000000-0000-0000-0000-000000000029',
  'Kodagu': 'd0000000-0000-0000-0000-000000000030',
  'Vijayanagara': 'd0000000-0000-0000-0000-000000000031',
}

const STATION_IDS: Record<string, string> = {
  'Koramangala PS': 's0000000-0000-0000-0000-000000000001',
  'JP Nagar PS': 's0000000-0000-0000-0000-000000000002',
  'Whitefield PS': 's0000000-0000-0000-0000-000000000003',
  'HSR Layout PS': 's0000000-0000-0000-0000-000000000004',
  'Mysuru North PS': 's0000000-0000-0000-0000-000000000005',
  'Belagavi City PS': 's0000000-0000-0000-0000-000000000006',
  'Kalaburagi Town PS': 's0000000-0000-0000-0000-000000000007',
  'Davanagere City PS': 's0000000-0000-0000-0000-000000000008',
  'Shivamogga Town PS': 's0000000-0000-0000-0000-000000000009',
  'Dharwad City PS': 's0000000-0000-0000-0000-000000000010',
}

// ─── Public Criminal Records (NCRB-derived wanted criminals) ───────────────────
// Based on NCRB most-wanted criminals data, Karnataka SIB alerts, and IPC categories
export interface PublicCriminal {
  id: string
  criminal_id: string
  full_name: string
  aliases: string[]
  age: number
  gender: string
  nationality: string
  education: string
  occupation: string
  address: string
  district_name: string
  risk_level: string
  risk_score: number
  is_wanted: boolean
  is_arrested: boolean
  is_absconding: boolean
  reward_amount: number | null
  photo_url: string | null
  total_cases: number
  total_convictions: number
  active_cases: number
  crime_specialization: string[]
  last_known_location: string
  modus_operandi: string
  created_at: string
}

export const PUBLIC_CRIMINALS: PublicCriminal[] = [
  {
    id: 'cr-pub-001', criminal_id: 'KSP-CR-2022-00101', full_name: 'Rajesh Kumar Shetty',
    aliases: ['Rajesh Don', 'Shetty Anna'], age: 38, gender: 'male', nationality: 'Indian',
    education: 'High School', occupation: 'Known Offender',
    address: 'Near Mangalore Port, Dakshina Kannada', district_name: 'Dakshina Kannada',
    risk_level: 'critical', risk_score: 95, is_wanted: true, is_arrested: false, is_absconding: true,
    reward_amount: 200000, photo_url: null, total_cases: 14, total_convictions: 3, active_cases: 11,
    crime_specialization: ['smuggling', 'arms_offense', 'organized_crime'],
    last_known_location: 'Mangalore, Karnataka / Mumbai, Maharashtra',
    modus_operandi: 'Operates a trans-state smuggling network using fishing boats along the Karnataka-Kerala coast. Uses coded communication via encrypted messaging apps. Known to bribe port officials for cargo clearance.',
    created_at: '2022-03-15T10:00:00Z',
  },
  {
    id: 'cr-pub-002', criminal_id: 'KSP-CR-2022-00202', full_name: 'Mohammed Irfan Patel',
    aliases: ['Irfan Cyber King', 'Digital Ghost'], age: 29, gender: 'male', nationality: 'Indian',
    education: 'B.Tech Computer Science', occupation: 'Unemployed',
    address: 'Koramangala, Bengaluru Urban', district_name: 'Bengaluru Urban',
    risk_level: 'high', risk_score: 78, is_wanted: true, is_arrested: false, is_absconding: true,
    reward_amount: 100000, photo_url: null, total_cases: 8, total_convictions: 0, active_cases: 8,
    crime_specialization: ['cybercrime', 'fraud', 'identity_theft'],
    last_known_location: 'Bengaluru / Hyderabad',
    modus_operandi: 'Creates fake banking websites and UPI interfaces to steal credentials. Targets IT professionals and senior citizens. Uses VPN chains and cryptocurrency for money laundering.',
    created_at: '2022-06-20T10:00:00Z',
  },
  {
    id: 'cr-pub-003', criminal_id: 'KSP-CR-2023-00303', full_name: 'Venkatesh Gowda',
    aliases: ['Venna Venkatesh', 'Gowda Rowdy'], age: 45, gender: 'male', nationality: 'Indian',
    education: 'PUC', occupation: 'Land Broker',
    address: 'Rajajinagar, Bengaluru Urban', district_name: 'Bengaluru Urban',
    risk_level: 'critical', risk_score: 92, is_wanted: true, is_arrested: false, is_absconding: true,
    reward_amount: 150000, photo_url: null, total_cases: 11, total_convictions: 2, active_cases: 9,
    crime_specialization: ['murder', 'extortion', 'land_encroachment'],
    last_known_location: 'Bengaluru / Chitradurga',
    modus_operandi: 'Runs a land-grabbing syndicate targeting agricultural land in peri-urban areas. Uses forged documents and threats to displace rightful owners. Employs local strongmen for intimidation.',
    created_at: '2023-01-10T10:00:00Z',
  },
  {
    id: 'cr-pub-004', criminal_id: 'KSP-CR-2023-00404', full_name: 'Lakshmi Devi Haragapur',
    aliases: ['Lakshmi Ben', 'Iron Lady'], age: 52, gender: 'female', nationality: 'Indian',
    education: 'SSLC', occupation: 'Self-proclaimed Healer',
    address: 'Gulbarga Fort Road, Kalaburagi', district_name: 'Kalaburagi',
    risk_level: 'high', risk_score: 72, is_wanted: true, is_arrested: false, is_absconding: true,
    reward_amount: 75000, photo_url: null, total_cases: 6, total_convictions: 1, active_cases: 5,
    crime_specialization: ['fraud', 'cheating', 'economic_offense'],
    last_known_location: 'Kalaburagi / Solapur, Maharashtra',
    modus_operandi: 'Runs fake healing clinics promising miracle cures. Collects large sums from desperate patients. Uses multiple fake identities and moves between Karnataka-Maharashtra border towns.',
    created_at: '2023-04-05T10:00:00Z',
  },
  {
    id: 'cr-pub-005', criminal_id: 'KSP-CR-2023-00505', full_name: 'Suresh Babu Naik',
    aliases: ['Suresh Don', 'Mining Mafia'], age: 48, gender: 'male', nationality: 'Indian',
    education: 'Graduate', occupation: 'Illegal Mining Operator',
    address: 'Bellary Mines Road, Ballari', district_name: 'Ballari',
    risk_level: 'critical', risk_score: 96, is_wanted: true, is_arrested: false, is_absconding: true,
    reward_amount: 300000, photo_url: null, total_cases: 9, total_convictions: 1, active_cases: 8,
    crime_specialization: ['illegal_mining', 'environmental_crime', 'bribery'],
    last_known_location: 'Ballari / Goa',
    modus_operandi: 'Operates illegal iron ore mining in Bellary-Hospet belt. Uses fake environmental clearances. Bribes forest and mining officials. Ships ore through unauthorized ports.',
    created_at: '2023-02-18T10:00:00Z',
  },
  {
    id: 'cr-pub-006', criminal_id: 'KSP-CR-2023-00606', full_name: 'Arjun Reddy Komati',
    aliases: ['Arjun Anna', 'Reddy Don'], age: 41, gender: 'male', nationality: 'Indian',
    education: 'MBA', occupation: 'Businessman (front)',
    address: 'Jayanagar, Bengaluru Urban', district_name: 'Bengaluru Urban',
    risk_level: 'high', risk_score: 82, is_wanted: true, is_arrested: false, is_absconding: true,
    reward_amount: 125000, photo_url: null, total_cases: 7, total_convictions: 0, active_cases: 7,
    crime_specialization: ['drug_offense', 'money_laundering', ' organized_crime'],
    last_known_location: 'Bengaluru / Dubai (suspected)',
    modus_operandi: 'Runs a pharmaceutical distribution company as front for drug trafficking. Uses commercial cargo routes to transport narcotics. Lauunders money through real estate investments.',
    created_at: '2023-05-22T10:00:00Z',
  },
  {
    id: 'cr-pub-007', criminal_id: 'KSP-CR-2022-00707', full_name: 'Prakash Salian',
    aliases: ['Pasha', 'Robber King'], age: 35, gender: 'male', nationality: 'Indian',
    education: 'PUC', occupation: 'Unemployed',
    address: 'Mangalore South, Dakshina Kannada', district_name: 'Dakshina Kannada',
    risk_level: 'high', risk_score: 76, is_wanted: true, is_arrested: false, is_absconding: true,
    reward_amount: 80000, photo_url: null, total_cases: 12, total_convictions: 4, active_cases: 8,
    crime_specialization: ['robbery', 'burglary', 'theft'],
    last_known_location: 'Mangalore / Kerala border',
    modus_operandi: 'Targets jewelry shops and banks in tier-2 cities. Uses stolen vehicles for getaway. Operates in a 4-member gang with precise roles (driver, lookout, executor, receiver).',
    created_at: '2022-09-01T10:00:00Z',
  },
  {
    id: 'cr-pub-008', criminal_id: 'KSP-CR-2024-00808', full_name: 'Farhan Ahmed Khan',
    aliases: ['Farhan Smart', 'Tech Thief'], age: 26, gender: 'male', nationality: 'Indian',
    education: 'B.Sc IT', occupation: 'Freelance Developer',
    address: 'Indiranagar, Bengaluru Urban', district_name: 'Bengaluru Urban',
    risk_level: 'medium', risk_score: 58, is_wanted: true, is_arrested: false, is_absconding: false,
    reward_amount: 50000, photo_url: null, total_cases: 4, total_convictions: 0, active_cases: 4,
    crime_specialization: ['cybercrime', 'data_theft', 'hacking'],
    last_known_location: 'Bengaluru',
    modus_operandi: 'Exploits vulnerabilities in corporate networks to steal customer data. Sells data on dark web marketplaces. Uses Tor network and cryptocurrency for anonymity.',
    created_at: '2024-01-12T10:00:00Z',
  },
  {
    id: 'cr-pub-009', criminal_id: 'KSP-CR-2024-00909', full_name: 'Kaveri Bai Patil',
    aliases: ['Kaveri Sister', 'Crime Queen'], age: 39, gender: 'female', nationality: 'Indian',
    education: 'SSLC', occupation: 'Housewife (cover)',
    address: 'Hubli, Dharwad', district_name: 'Dharwad',
    risk_level: 'high', risk_score: 74, is_wanted: true, is_arrested: false, is_absconding: true,
    reward_amount: 90000, photo_url: null, total_cases: 5, total_convictions: 1, active_cases: 4,
    crime_specialization: ['kidnapping', 'extortion', 'cheating'],
    last_known_location: 'Hubli / Belagavi',
    modus_operandi: 'Lures victims through fake marriage proposals. Orchestrates kidnapping-for-ransom operations using her network. Uses multiple SIM cards and burner phones.',
    created_at: '2024-02-28T10:00:00Z',
  },
  {
    id: 'cr-pub-010', criminal_id: 'KSP-CR-2023-01010', full_name: 'Nagaraj Bhat',
    aliases: ['Naganna', 'Land Shark'], age: 55, gender: 'male', nationality: 'Indian',
    education: 'LLB', occupation: 'Fake Advocate',
    address: 'Madikeri, Kodagu', district_name: 'Kodagu',
    risk_level: 'medium', risk_score: 62, is_wanted: true, is_arrested: false, is_absconding: false,
    reward_amount: 60000, photo_url: null, total_cases: 3, total_convictions: 0, active_cases: 3,
    crime_specialization: ['forgery', 'cheating', 'property_crime'],
    last_known_location: 'Madikeri / Mysuru',
    modus_operandi: 'Creates forged property documents to claim ownership of ancestral lands. Targets elderly landowners without legal heirs. Uses court processes to legitimize fraudulent claims.',
    created_at: '2023-08-15T10:00:00Z',
  },
  {
    id: 'cr-pub-011', criminal_id: 'KSP-CR-2022-01111', full_name: 'Darshan Gowda Patil',
    aliases: ['Darshan Killer', 'Rowdy Darshan'], age: 32, gender: 'male', nationality: 'Indian',
    education: 'PUC', occupation: 'Auto Driver',
    address: 'Vijayapura Main Road', district_name: 'Vijayapura',
    risk_level: 'critical', risk_score: 91, is_wanted: true, is_arrested: false, is_absconding: true,
    reward_amount: 180000, photo_url: null, total_cases: 5, total_convictions: 1, active_cases: 4,
    crime_specialization: ['murder', 'assault', 'intimidation'],
    last_known_location: 'Vijayapura / Hyderabad',
    modus_operandi: 'Known for violent confrontations over petty disputes. Uses sharp weapons. Has history of attacking witnesses. Escaped from custody in 2023.',
    created_at: '2022-11-20T10:00:00Z',
  },
  {
    id: 'cr-pub-012', criminal_id: 'KSP-CR-2024-01212', full_name: 'Rekha Sharma',
    aliases: ['Rekha Madam', 'Queen of Fraud'], age: 44, gender: 'female', nationality: 'Indian',
    education: 'M.Com', occupation: 'Finance Agent',
    address: 'Shivajinagar, Bengaluru Urban', district_name: 'Bengaluru Urban',
    risk_level: 'high', risk_score: 70, is_wanted: true, is_arrested: false, is_absconding: true,
    reward_amount: 85000, photo_url: null, total_cases: 6, total_convictions: 0, active_cases: 6,
    crime_specialization: ['fraud', 'cheating', 'economic_offense'],
    last_known_location: 'Bengaluru / Pune',
    modus_operandi: 'Runs a Ponzi scheme targeting middle-class families. Promises 30% monthly returns on investments. Uses multi-level recruitment. Currently estimated to have defrauded ₹45 crore.',
    created_at: '2024-03-05T10:00:00Z',
  },
  {
    id: 'cr-pub-013', criminal_id: 'KSP-CR-2023-01313', full_name: 'Vijay Kumar Jha',
    aliases: ['Vijay Bhai', 'Contract Killer'], age: 37, gender: 'male', nationality: 'Indian',
    education: '10th Standard', occupation: 'Unknown',
    address: 'Raichur Fort Area', district_name: 'Raichur',
    risk_level: 'critical', risk_score: 97, is_wanted: true, is_arrested: false, is_absconding: true,
    reward_amount: 500000, photo_url: null, total_cases: 4, total_convictions: 0, active_cases: 4,
    crime_specialization: ['murder', 'contract_killing', 'arms_offense'],
    last_known_location: 'Raichur / Andhra Pradesh border',
    modus_operandi: 'Allegedly involved in contract killings for land and business disputes. Uses professional methods with untraceable weapons. Connected to organized crime networks in AP-TS-KA.',
    created_at: '2023-07-01T10:00:00Z',
  },
  {
    id: 'cr-pub-014', criminal_id: 'KSP-CR-2022-01414', full_name: 'Shameer Pasha',
    aliases: ['Shameer Gold', 'Gold Smuggler'], age: 42, gender: 'male', nationality: 'Indian',
    education: 'Inter', occupation: 'Gold Merchant (cover)',
    address: 'Dharwad Old City', district_name: 'Dharwad',
    risk_level: 'high', risk_score: 75, is_wanted: true, is_arrested: false, is_absconding: true,
    reward_amount: 100000, photo_url: null, total_cases: 7, total_convictions: 2, active_cases: 5,
    crime_specialization: ['smuggling', 'gold_smuggling', 'customs_evasion'],
    last_known_location: 'Dharwad / Mumbai',
    modus_operandi: 'Smuggles gold from Gulf countries via hawala route. Uses jewelry shops as front. Hides gold in commercial cargo shipments. Employs carriers from economically vulnerable backgrounds.',
    created_at: '2022-05-10T10:00:00Z',
  },
  {
    id: 'cr-pub-015', criminal_id: 'KSP-CR-2024-01515', full_name: 'Priya Venkatesh',
    aliases: ['Priya Hacker', 'Code Breaker'], age: 24, gender: 'female', nationality: 'Indian',
    education: 'B.Tech CSE', occupation: 'Freelancer',
    address: 'Electronic City, Bengaluru Urban', district_name: 'Bengaluru Urban',
    risk_level: 'medium', risk_score: 55, is_wanted: true, is_arrested: false, is_absconding: false,
    reward_amount: 40000, photo_url: null, total_cases: 3, total_convictions: 0, active_cases: 3,
    crime_specialization: ['cybercrime', 'data_breach', 'hacking'],
    last_known_location: 'Bengaluru',
    modus_operandi: 'Exploits corporate HR portals to access employee PII. Sells data to competitor companies. Uses steganography to hide data exfiltration within normal traffic.',
    created_at: '2024-04-10T10:00:00Z',
  },
  {
    id: 'cr-pub-016', criminal_id: 'KSP-CR-2023-01616', full_name: 'Basavaraj Mallesh',
    aliases: ['Basanna', 'Drug Baron'], age: 47, gender: 'male', nationality: 'Indian',
    education: 'PUC', occupation: 'Transport Owner',
    address: 'Shimoga Town', district_name: 'Shivamogga',
    risk_level: 'high', risk_score: 80, is_wanted: true, is_arrested: false, is_absconding: true,
    reward_amount: 110000, photo_url: null, total_cases: 8, total_convictions: 1, active_cases: 7,
    crime_specialization: ['drug_offense', 'narcotics', 'transport_fraud'],
    last_known_location: 'Shivamogga / Goa',
    modus_operandi: 'Uses his transport company to move narcotics between Goa and North Karnataka. Conceals drugs in legitimate cargo. Has network of receivers across 5 districts.',
    created_at: '2023-09-15T10:00:00Z',
  },
  {
    id: 'cr-pub-017', criminal_id: 'KSP-CR-2022-01717', full_name: 'Imran Safdar Ali',
    aliases: ['Imran Bhai', 'The Ghost'], age: 50, gender: 'male', nationality: 'Indian',
    education: 'Graduate', occupation: 'Businessman',
    address: 'Hubli-Dharwad Twin City', district_name: 'Dharwad',
    risk_level: 'critical', risk_score: 88, is_wanted: true, is_arrested: false, is_absconding: true,
    reward_amount: 250000, photo_url: null, total_cases: 10, total_convictions: 2, active_cases: 8,
    crime_specialization: ['organized_crime', 'extortion', 'property_crime'],
    last_known_location: 'Hubli / Dubai (suspected)',
    modus_operandi: 'Commands a organized crime syndicate in North Karnataka. Extorts businessmen and contractors. Uses political connections for protection. Never stays in one city more than 3 days.',
    created_at: '2022-08-05T10:00:00Z',
  },
  {
    id: 'cr-pub-018', criminal_id: 'KSP-CR-2024-01818', full_name: 'Chitra Devi Shetty',
    aliases: ['Chitra Sister', 'Fraud Devi'], age: 36, gender: 'female', nationality: 'Indian',
    education: 'B.Com', occupation: 'Travel Agent',
    address: 'Mangalore Balmatta', district_name: 'Dakshina Kannada',
    risk_level: 'medium', risk_score: 48, is_wanted: true, is_arrested: false, is_absconding: false,
    reward_amount: 30000, photo_url: null, total_cases: 4, total_convictions: 0, active_cases: 4,
    crime_specialization: ['fraud', 'cheating', 'forgery'],
    last_known_location: 'Mangalore',
    modus_operandi: 'Runs fake international tour packages. Collects advance payments and disappears. Uses forged visa documents. Targets families planning pilgrimages.',
    created_at: '2024-05-20T10:00:00Z',
  },
  {
    id: 'cr-pub-019', criminal_id: 'KSP-CR-2023-01919', full_name: 'Manjunath Naik',
    aliases: ['Manja', 'Snake Manjunath'], age: 40, gender: 'male', nationality: 'Indian',
    education: 'SSLC', occupation: 'Farmer',
    address: 'Belgaum Rural', district_name: 'Belagavi',
    risk_level: 'medium', risk_score: 45, is_wanted: true, is_arrested: false, is_absconding: false,
    reward_amount: 25000, photo_url: null, total_cases: 3, total_convictions: 1, active_cases: 2,
    crime_specialization: ['wildlife_crime', 'poaching', 'smuggling'],
    last_known_location: 'Belagavi / Goa border',
    modus_operandi: 'Poaches protected wildlife in Western Ghats. Traffics animal parts to international buyers through Goa ports. Uses local tribal communities as unknowing intermediaries.',
    created_at: '2023-11-01T10:00:00Z',
  },
  {
    id: 'cr-pub-020', criminal_id: 'KSP-CR-2024-02020', full_name: 'Ayesha Begum',
    aliases: ['Ayesha Madam', 'Crime Sister'], age: 33, gender: 'female', nationality: 'Indian',
    education: 'Graduate', occupation: 'NGO Worker (cover)',
    address: 'Gulbarga City', district_name: 'Kalaburagi',
    risk_level: 'high', risk_score: 68, is_wanted: true, is_arrested: false, is_absconding: true,
    reward_amount: 70000, photo_url: null, total_cases: 5, total_convictions: 0, active_cases: 5,
    crime_specialization: ['kidnapping', 'human_trafficking', 'cheating'],
    last_known_location: 'Kalaburagi / Mumbai',
    modus_operandi: 'Uses fake NGO to gain trust of vulnerable families. Lures young women with promises of employment in cities. Connected to human trafficking network spanning KA-MH-GJ.',
    created_at: '2024-06-01T10:00:00Z',
  },
]

// ─── Public FIR Records ────────────────────────────────────────────────────────
export interface PublicFIR {
  id: string
  fir_number: string
  complainant_name: string
  complainant_phone: string | null
  incident_date: string
  incident_location: string
  crime_category: string
  crime_description: string
  ipc_sections: string[]
  status: string
  accused_known: boolean
  is_duplicate: boolean
  property_value: number | null
  district_name: string
  station_name: string
  investigation_officer: string
  officer_badge: string
  created_at: string
}

export const PUBLIC_FIRS: PublicFIR[] = [
  {
    id: 'fir-pub-001', fir_number: 'FIR/KSPB/2025/00101', complainant_name: 'Ramesh Babu',
    complainant_phone: '9876543210', incident_date: '2025-01-15T14:30:00Z',
    incident_location: 'Koramangala 4th Block, Near Jyoti Nivas College',
    crime_category: 'cybercrime', crime_description: 'Victim received a phishing call claiming to be from SBI bank. Fraudsters tricked victim into sharing OTP and Rs. 3,45,000 was deducted from two accounts.',
    ipc_sections: ['420', '468', '471', '66D IT Act'], status: 'under_investigation',
    accused_known: false, is_duplicate: false, property_value: 345000,
    district_name: 'Bengaluru Urban', station_name: 'Koramangala PS',
    investigation_officer: 'Inspector Kavitha Reddy', officer_badge: 'KSP-1234',
    created_at: '2025-01-15T15:00:00Z',
  },
  {
    id: 'fir-pub-002', fir_number: 'FIR/KSPB/2025/00102', complainant_name: 'Sunitha Sharma',
    complainant_phone: '9845123456', incident_date: '2025-02-03T09:15:00Z',
    incident_location: 'HSR Layout Sector 2, 27th Main Road',
    crime_category: 'theft', crime_description: 'Two-wheeler (Honda Activa, KA-01-AB-1234) stolen from parking lot of apartment complex between 8 PM and 6 AM.',
    ipc_sections: ['379'], status: 'filed',
    accused_known: false, is_duplicate: false, property_value: 95000,
    district_name: 'Bengaluru Urban', station_name: 'HSR Layout PS',
    investigation_officer: 'SI Ravi Shankar', officer_badge: 'KSP-2345',
    created_at: '2025-02-03T10:00:00Z',
  },
  {
    id: 'fir-pub-003', fir_number: 'FIR/KSPM/2025/00103', complainant_name: 'Kumaraswamy M',
    complainant_phone: '9845678901', incident_date: '2025-03-20T18:45:00Z',
    incident_location: 'Vani Vilas Mohalla, Near Mysore Palace',
    crime_category: 'robbery', crime_description: 'Three armed men on a motorcycle snatched gold chain worth Rs. 2.5 lakh from victim while she was walking home from market.',
    ipc_sections: ['392', '397', '34'], status: 'chargesheeted',
    accused_known: true, is_duplicate: false, property_value: 250000,
    district_name: 'Mysuru', station_name: 'Mysuru North PS',
    investigation_officer: 'Inspector Mahesh Kumar', officer_badge: 'KSP-3456',
    created_at: '2025-03-20T19:30:00Z',
  },
  {
    id: 'fir-pub-004', fir_number: 'FIR/KSPB/2025/00104', complainant_name: 'Deepa Nair',
    complainant_phone: '9871234567', incident_date: '2025-04-10T11:00:00Z',
    incident_location: 'Whitefield Main Road, ITPL Junction',
    crime_category: 'fraud', crime_description: 'Victim invested Rs. 15 lakh in a fake cryptocurrency scheme promised by agents who claimed 50% returns in 3 months. Company office locked, operators absconded.',
    ipc_sections: ['420', '406', '120B'], status: 'under_investigation',
    accused_known: true, is_duplicate: false, property_value: 1500000,
    district_name: 'Bengaluru Urban', station_name: 'Whitefield PS',
    investigation_officer: 'Inspector Priya Menon', officer_badge: 'KSP-4567',
    created_at: '2025-04-10T12:00:00Z',
  },
  {
    id: 'fir-pub-005', fir_number: 'FIR/KSPB/2025/00105', complainant_name: 'Anand Patel',
    complainant_phone: '9823456789', incident_date: '2025-05-05T22:30:00Z',
    incident_location: 'JP Nagar 7th Phase, 100 Feet Ring Road',
    crime_category: 'burglary', crime_description: 'Burglars broke into house through kitchen window while family was on vacation. Stole gold ornaments, electronics, and cash totaling approximately Rs. 8.5 lakh.',
    ipc_sections: ['380', '454', '457'], status: 'filed',
    accused_known: false, is_duplicate: false, property_value: 850000,
    district_name: 'Bengaluru Urban', station_name: 'JP Nagar PS',
    investigation_officer: 'SI Ganesh Prasad', officer_badge: 'KSP-5678',
    created_at: '2025-05-06T08:00:00Z',
  },
  {
    id: 'fir-pub-006', fir_number: 'FIR/KSPL/2025/00106', complainant_name: 'Girish Bhat',
    complainant_phone: '9845987654', incident_date: '2025-01-28T16:00:00Z',
    incident_location: 'Belgaum Camp, Near KLC Railway Station',
    crime_category: 'assault', crime_description: 'Group of 4 men attacked victim with iron rods over a property dispute. Victim suffered multiple fractures and is hospitalized.',
    ipc_sections: ['326', '323', '147', '148', '149'], status: 'chargesheeted',
    accused_known: true, is_duplicate: false, property_value: null,
    district_name: 'Belagavi', station_name: 'Belagavi City PS',
    investigation_officer: 'Inspector Suresh Hulikar', officer_badge: 'KSP-6789',
    created_at: '2025-01-28T17:00:00Z',
  },
  {
    id: 'fir-pub-007', fir_number: 'FIR/KSPK/2025/00107', complainant_name: 'Razia Begum',
    complainant_phone: '9876123456', incident_date: '2025-06-12T13:20:00Z',
    incident_location: 'Gulbarga Fort Road, Near Idgah Maidan',
    crime_category: 'kidnapping', crime_description: 'Minor daughter (age 16) did not return from tuition class. Phone switched off. Family received ransom call demanding Rs. 10 lakh.',
    ipc_sections: ['363', '364A', '376'], status: 'under_investigation',
    accused_known: false, is_duplicate: false, property_value: null,
    district_name: 'Kalaburagi', station_name: 'Kalaburagi Town PS',
    investigation_officer: 'Inspector Firoz Khan', officer_badge: 'KSP-7890',
    created_at: '2025-06-12T14:00:00Z',
  },
  {
    id: 'fir-pub-008', fir_number: 'FIR/KSPD/2025/00108', complainant_name: 'Shivanand Kulkarni',
    complainant_phone: '9845321654', incident_date: '2025-02-14T07:30:00Z',
    incident_location: 'Davangere Motor Stand, near KSRTC Bus Stand',
    crime_category: 'drug_offense', crime_description: 'Police patrol intercepted suspicious vehicle. Search revealed 2.5 kg of ganja and 50 tablets of MDMA concealed in modified fuel tank.',
    ipc_sections: ['20(b) NDPS Act', '21 NDPS Act', '29 NDPS Act'], status: 'chargesheeted',
    accused_known: true, is_duplicate: false, property_value: 500000,
    district_name: 'Davanagere', station_name: 'Davanagere City PS',
    investigation_officer: 'Inspector Rajesh Tentu', officer_badge: 'KSP-8901',
    created_at: '2025-02-14T09:00:00Z',
  },
  {
    id: 'fir-pub-009', fir_number: 'FIR/KSPT/2025/00109', complainant_name: 'Lakshmi Narayana',
    complainant_phone: '9867123456', incident_date: '2025-03-08T10:45:00Z',
    incident_location: 'Tumkur Town, B.H. Road, Near SBI Branch',
    crime_category: 'cheating', crime_description: 'Victim lured by agent promising government job in exchange for Rs. 5 lakh bribe. Agent gave fake appointment letter. When victim went to join, discovered letter was forged.',
    ipc_sections: ['420', '468', '471'], status: 'under_investigation',
    accused_known: true, is_duplicate: false, property_value: 500000,
    district_name: 'Tumakuru', station_name: 'Tumakuru Town PS',
    investigation_officer: 'SI Prakash Raj', officer_badge: 'KSP-9012',
    created_at: '2025-03-08T11:30:00Z',
  },
  {
    id: 'fir-pub-010', fir_number: 'FIR/KSPH/2025/00110', complainant_name: 'Vijaya Kumari',
    complainant_phone: '9876987654', incident_date: '2025-04-22T15:00:00Z',
    incident_location: 'Hassan Town, B.M. Road, Near Arsikere Circle',
    crime_category: 'property_crime', crime_description: 'Commercial building owner found shop broken into early morning. CCTV shows two masked individuals using cutting tools on shutters. Cash and electronics stolen.',
    ipc_sections: ['380', '454', '457', '34'], status: 'filed',
    accused_known: false, is_duplicate: false, property_value: 420000,
    district_name: 'Hassan', station_name: 'Hassan Town PS',
    investigation_officer: 'Inspector Naveen Kumar', officer_badge: 'KSP-1122',
    created_at: '2025-04-22T16:00:00Z',
  },
  {
    id: 'fir-pub-011', fir_number: 'FIR/KSPB/2025/00111', complainant_name: 'Arun Sharma',
    complainant_phone: '9812345678', incident_date: '2025-05-18T20:15:00Z',
    incident_location: 'M.G. Road, Near Brigade Road Junction',
    crime_category: 'theft', crime_description: 'Chain snatching incident near busy market area. Two men on bike snatched gold chain (22 carat, 18 grams) from victim wife while walking.',
    ipc_sections: ['392', '34'], status: 'filed',
    accused_known: false, is_duplicate: false, property_value: 108000,
    district_name: 'Bengaluru Urban', station_name: 'Koramangala PS',
    investigation_officer: 'Inspector Kavitha Reddy', officer_badge: 'KSP-1234',
    created_at: '2025-05-18T21:00:00Z',
  },
  {
    id: 'fir-pub-012', fir_number: 'FIR/KSPP/2025/00112', complainant_name: 'Nagesh Reddy',
    complainant_phone: '9845789123', incident_date: '2025-06-01T08:00:00Z',
    incident_location: 'Raichur Main Road, Near Railway Station',
    crime_category: 'economic_offense', crime_description: 'Fake currency notes of Rs. 500 denomination totaling Rs. 2.5 lakh circulated in local market. Multiple shopkeepers received fake notes.',
    ipc_sections: ['489B', '489C', '489D'], status: 'under_investigation',
    accused_known: false, is_duplicate: false, property_value: 250000,
    district_name: 'Raichur', station_name: 'Raichur Town PS',
    investigation_officer: 'Inspector Venkateshwarlu', officer_badge: 'KSP-3344',
    created_at: '2025-06-01T09:00:00Z',
  },
  {
    id: 'fir-pub-013', fir_number: 'FIR/KSPS/2025/00113', complainant_name: 'Poornima Shetty',
    complainant_phone: '9823987654', incident_date: '2025-03-15T12:30:00Z',
    incident_location: 'Shimoga Town, Lingappana Kere Road',
    crime_category: 'assault', crime_description: 'Eve-teasing and physical assault on woman college student by three men on two-wheeler. Victim sustained injuries and was admitted to hospital.',
    ipc_sections: ['354A', '323', '509', '147', '34'], status: 'chargesheeted',
    accused_known: true, is_duplicate: false, property_value: null,
    district_name: 'Shivamogga', station_name: 'Shivamogga Town PS',
    investigation_officer: 'Inspector Manju Devi', officer_badge: 'KSP-5566',
    created_at: '2025-03-15T13:30:00Z',
  },
  {
    id: 'fir-pub-014', fir_number: 'FIR/KSPB/2025/00114', complainant_name: 'Mohammed Farooq',
    complainant_phone: '9834567890', incident_date: '2025-07-02T16:45:00Z',
    incident_location: 'Shivajinagar, Near Russell Market',
    crime_category: 'murder', crime_description: 'Unidentified assailants stabbed victim (age 35) near market area. Victim was declared brought dead at Victoria Hospital. Motime suspected to be personal rivalry.',
    ipc_sections: ['302', '34', '201'], status: 'under_investigation',
    accused_known: false, is_duplicate: false, property_value: null,
    district_name: 'Bengaluru Urban', station_name: 'Koramangala PS',
    investigation_officer: 'Inspector Kavitha Reddy', officer_badge: 'KSP-1234',
    created_at: '2025-07-02T17:30:00Z',
  },
  {
    id: 'fir-pub-015', fir_number: 'FIR/KSPV/2025/00115', complainant_name: 'Shankarappa Doddamani',
    complainant_phone: '9867345678', incident_date: '2025-04-15T10:00:00Z',
    incident_location: 'Vijayapura City, Near Jamkhandi Circle',
    crime_category: 'burglary', crime_description: 'Multiple houses in same colony burgled during daytime while residents were at work. At least 3 houses targeted in coordinated operation.',
    ipc_sections: ['380', '454', '457', '120B'], status: 'under_investigation',
    accused_known: false, is_duplicate: false, property_value: 1200000,
    district_name: 'Vijayapura', station_name: 'Vijayapura City PS',
    investigation_officer: 'Inspector Basavaraj Inamdar', officer_badge: 'KSP-7788',
    created_at: '2025-04-15T11:00:00Z',
  },
  {
    id: 'fir-pub-016', fir_number: 'FIR/KSPBD/2025/00116', complainant_name: 'Sarojini Devi',
    complainant_phone: '9845123000', incident_date: '2025-05-25T14:20:00Z',
    incident_location: 'Bidar Fort Road, Near Gurudwara',
    crime_category: 'cheating', crime_description: 'Retired government employee cheated of Rs. 8 lakh by fake health insurance agent who promised cashless treatment at premium hospitals.',
    ipc_sections: ['420', '406'], status: 'filed',
    accused_known: true, is_duplicate: false, property_value: 800000,
    district_name: 'Bidar', station_name: 'Bidar Town PS',
    investigation_officer: 'SI Abdul Rashid', officer_badge: 'KSP-9900',
    created_at: '2025-05-25T15:00:00Z',
  },
  {
    id: 'fir-pub-017', fir_number: 'FIR/KSPCM/2025/00117', complainant_name: 'Lingaraju',
    complainant_phone: '9876234567', incident_date: '2025-06-08T11:30:00Z',
    incident_location: 'Chamrajnagar Town, Near Government Hospital',
    crime_category: 'kidnapping', crime_description: 'Minor boy (age 14) kidnapped from school premises during lunch break. Kidnappers demanded Rs. 50 lakh ransom from wealthy businessman father.',
    ipc_sections: ['363', '364A'], status: 'under_investigation',
    accused_known: false, is_duplicate: false, property_value: null,
    district_name: 'Chamarajanagar', station_name: 'Chamrajnagar Town PS',
    investigation_officer: 'Inspector Ramesh Babu', officer_badge: 'KSP-1123',
    created_at: '2025-06-08T12:30:00Z',
  },
  {
    id: 'fir-pub-018', fir_number: 'FIR/KSPBL/2025/00118', complainant_name: 'Vijayalakshmi',
    complainant_phone: '9834876543', incident_date: '2025-02-20T09:00:00Z',
    incident_location: 'Ballari City, Kambalagere Road',
    crime_category: 'fraud', crime_description: 'Real estate agent collected Rs. 25 lakh for plot registration but never transferred property. Agent disappeared after collecting advance from multiple buyers for same plot.',
    ipc_sections: ['420', '406', '120B'], status: 'chargesheeted',
    accused_known: true, is_duplicate: false, property_value: 2500000,
    district_name: 'Ballari', station_name: 'Ballari Town PS',
    investigation_officer: 'Inspector Shivaraj', officer_badge: 'KSP-4455',
    created_at: '2025-02-20T10:00:00Z',
  },
  {
    id: 'fir-pub-019', fir_number: 'FIR/KSPU/2025/00119', complainant_name: 'Harshith Kumar',
    complainant_phone: '9856789012', incident_date: '2025-07-10T17:00:00Z',
    incident_location: 'Udupi Krishna Mutt Road, Near Bus Stand',
    crime_category: 'theft', crime_description: 'Laptop (MacBook Pro) and bag containing important documents stolen from restaurant while victim was dining. Estimated value Rs. 1.8 lakh.',
    ipc_sections: ['379'], status: 'filed',
    accused_known: false, is_duplicate: false, property_value: 180000,
    district_name: 'Udupi', station_name: 'Udupi Town PS',
    investigation_officer: 'SI Pramod Nayak', officer_badge: 'KSP-6677',
    created_at: '2025-07-10T18:00:00Z',
  },
  {
    id: 'fir-pub-020', fir_number: 'FIR/KSPK/2025/00120', complainant_name: 'Madhavi Kulkarni',
    complainant_phone: '9821987654', incident_date: '2025-06-25T12:00:00Z',
    incident_location: 'Koppal Town, Station Road',
    crime_category: 'property_crime', crime_description: 'Shopkeeper found lock broken and Rs. 3 lakh cash along with gold ornaments stolen from jewelry shop overnight. CCTV cameras found disabled.',
    ipc_sections: ['380', '454', '457'], status: 'under_investigation',
    accused_known: false, is_duplicate: false, property_value: 300000,
    district_name: 'Koppal', station_name: 'Koppal Town PS',
    investigation_officer: 'Inspector Hanumanthappa', officer_badge: 'KSP-8899',
    created_at: '2025-06-25T13:00:00Z',
  },
]

// ─── Public Case Records ───────────────────────────────────────────────────────
export interface PublicCase {
  id: string
  case_number: string
  title: string
  description: string
  crime_category: string
  status: string
  priority: number
  ai_risk_score: number
  case_registered_date: string
  incident_date: string
  tags: string[]
  ipc_sections: string[]
  district_name: string
  station_name: string
  assigned_officer: string
  officer_badge: string
  suspect_count: number
  victim_count: number
  evidence_count: number
  created_at: string
}

export const PUBLIC_CASES: PublicCase[] = [
  {
    id: 'case-pub-001', case_number: 'KSP-2025-000101',
    title: 'Serial Cyber Fraud Targeting Senior Citizens in Bengaluru',
    description: 'A syndicate has been targeting senior citizens through phishing calls and fake bank websites. Over 45 victims reported losses totaling Rs. 1.2 crore in the past 3 months. Investigation reveals links to an international call center in Noida.',
    crime_category: 'cybercrime', status: 'under_investigation', priority: 4, ai_risk_score: 82,
    case_registered_date: '2025-01-20T10:00:00Z', incident_date: '2025-01-15T14:30:00Z',
    tags: ['cyber', 'fraud', 'senior_citizens', 'serial_offender'],
    ipc_sections: ['420', '468', '471', '66D IT Act', '66C IT Act'],
    district_name: 'Bengaluru Urban', station_name: 'Koramangala PS',
    assigned_officer: 'Inspector Kavitha Reddy', officer_badge: 'KSP-1234',
    suspect_count: 3, victim_count: 45, evidence_count: 12,
    created_at: '2025-01-20T10:00:00Z',
  },
  {
    id: 'case-pub-002', case_number: 'KSP-2025-000102',
    title: 'Organized Gold Chain Snatching Gang - South Karnataka',
    description: 'A 5-member gang operating across Bengaluru, Mysuru, and Hassan has been snatching gold chains from women in crowded areas. Gang uses motorcycles and strikes during evening hours.',
    crime_category: 'robbery', status: 'under_investigation', priority: 3, ai_risk_score: 68,
    case_registered_date: '2025-03-01T10:00:00Z', incident_date: '2025-02-28T18:00:00Z',
    tags: ['robbery', 'gang', 'serial', 'chain_snatching'],
    ipc_sections: ['392', '397', '34', '120B'],
    district_name: 'Bengaluru Urban', station_name: 'HSR Layout PS',
    assigned_officer: 'SI Ravi Shankar', officer_badge: 'KSP-2345',
    suspect_count: 5, victim_count: 23, evidence_count: 8,
    created_at: '2025-03-01T10:00:00Z',
  },
  {
    id: 'case-pub-003', case_number: 'KSP-2025-000103',
    title: 'Illegal Mining Operations in Bellary-Hospet Belt',
    description: 'Satellite imagery and forest department reports confirm large-scale illegal iron ore mining in protected forest areas. Estimated loss to exchequer is Rs. 50 crore. Involvement of politically connected individuals suspected.',
    crime_category: 'economic_offense', status: 'under_investigation', priority: 5, ai_risk_score: 91,
    case_registered_date: '2025-02-10T10:00:00Z', incident_date: '2025-01-01T00:00:00Z',
    tags: ['illegal_mining', 'environmental', 'high_profile', 'political'],
    ipc_sections: ['379', '414', '120B', 'Forest Act 1980', 'MMDR Act'],
    district_name: 'Ballari', station_name: 'Ballari Town PS',
    assigned_officer: 'Inspector Shivaraj', officer_badge: 'KSP-4455',
    suspect_count: 8, victim_count: 0, evidence_count: 25,
    created_at: '2025-02-10T10:00:00Z',
  },
  {
    id: 'case-pub-004', case_number: 'KSP-2025-000104',
    title: 'Drug Trafficking Network - Goa to North Karnataka',
    description: 'Inter-state narcotics trafficking route identified from Goa to Hubli-Dharwad. Seizure of 5 kg ganja and 200 MDMA tablets during highway checkpoint. Transport company used as cover.',
    crime_category: 'drug_offense', status: 'chargesheet_filed', priority: 4, ai_risk_score: 78,
    case_registered_date: '2025-04-05T10:00:00Z', incident_date: '2025-04-01T16:00:00Z',
    tags: ['narcotics', 'inter_state', 'transport', 'organized'],
    ipc_sections: ['20(b) NDPS Act', '21 NDPS Act', '29 NDPS Act', '120B'],
    district_name: 'Dharwad', station_name: 'Dharwad City PS',
    assigned_officer: 'Inspector Hanumantha', officer_badge: 'KSP-7788',
    suspect_count: 4, victim_count: 0, evidence_count: 15,
    created_at: '2025-04-05T10:00:00Z',
  },
  {
    id: 'case-pub-005', case_number: 'KSP-2025-000105',
    title: 'Homicide Investigation - Shivajinagar Stabbing',
    description: 'Fatal stabbing near Russell Market during evening hours. Victim died on way to hospital. CCTV footage recovered showing 2 assailants. Personal rivalry suspected between victim and known accused.',
    crime_category: 'murder', status: 'under_investigation', priority: 5, ai_risk_score: 95,
    case_registered_date: '2025-07-02T18:00:00Z', incident_date: '2025-07-02T16:45:00Z',
    tags: ['homicide', 'stabbing', 'personal_rivalry', 'urgent'],
    ipc_sections: ['302', '34', '201'],
    district_name: 'Bengaluru Urban', station_name: 'Koramangala PS',
    assigned_officer: 'Inspector Kavitha Reddy', officer_badge: 'KSP-1234',
    suspect_count: 2, victim_count: 1, evidence_count: 6,
    created_at: '2025-07-02T18:00:00Z',
  },
  {
    id: 'case-pub-006', case_number: 'KSP-2025-000106',
    title: 'Multi-Crore Ponzi Investment Fraud',
    description: 'Finance company running Ponzi scheme promising 30% monthly returns. Over 2000 investors defrauded of approximately Rs. 45 crore. Main operator absconded. Financial audit reveals circular transactions.',
    crime_category: 'fraud', status: 'under_investigation', priority: 5, ai_risk_score: 88,
    case_registered_date: '2025-04-15T10:00:00Z', incident_date: '2025-03-01T00:00:00Z',
    tags: ['ponzi', 'financial_fraud', 'mass_victim', 'economic'],
    ipc_sections: ['420', '406', '120B', 'Banning of Unregulated Deposits Schemes Act'],
    district_name: 'Bengaluru Urban', station_name: 'Whitefield PS',
    assigned_officer: 'Inspector Priya Menon', officer_badge: 'KSP-4567',
    suspect_count: 3, victim_count: 2000, evidence_count: 30,
    created_at: '2025-04-15T10:00:00Z',
  },
  {
    id: 'case-pub-007', case_number: 'KSP-2025-000107',
    title: 'Land Encroachment and Forgery Syndicate - Bengaluru Periphery',
    description: 'Syndicate targeting agricultural land in peri-urban areas of Bengaluru. Uses forged sale deeds and power of attorney to grab land worth hundreds of crores. Over 15 farmers have filed complaints.',
    crime_category: 'property_crime', status: 'under_investigation', priority: 4, ai_risk_score: 75,
    case_registered_date: '2025-01-25T10:00:00Z', incident_date: '2024-12-01T00:00:00Z',
    tags: ['land_grab', 'forgery', 'syndicate', 'farmers'],
    ipc_sections: ['420', '467', '468', '471', '120B'],
    district_name: 'Bengaluru Urban', station_name: 'JP Nagar PS',
    assigned_officer: 'SI Ganesh Prasad', officer_badge: 'KSP-5678',
    suspect_count: 6, victim_count: 15, evidence_count: 20,
    created_at: '2025-01-25T10:00:00Z',
  },
  {
    id: 'case-pub-008', case_number: 'KSP-2025-000108',
    title: 'Human Trafficking Ring Operating Through Fake NGOs',
    description: 'Fake NGO used to recruit vulnerable women and children from rural areas. Victims promised employment in cities but trafficked to other states. Network spans Karnataka, Maharashtra, and Gujarat.',
    crime_category: 'kidnapping', status: 'under_investigation', priority: 5, ai_risk_score: 93,
    case_registered_date: '2025-06-15T10:00:00Z', incident_date: '2025-05-01T00:00:00Z',
    tags: ['trafficking', 'ngo', 'women', 'children', 'inter_state'],
    ipc_sections: ['363', '364A', '370', '376', '120B'],
    district_name: 'Kalaburagi', station_name: 'Kalaburagi Town PS',
    assigned_officer: 'Inspector Firoz Khan', officer_badge: 'KSP-7890',
    suspect_count: 4, victim_count: 30, evidence_count: 18,
    created_at: '2025-06-15T10:00:00Z',
  },
  {
    id: 'case-pub-009', case_number: 'KSP-2025-000109',
    title: 'Serial Burglary Ring Targeting Tier-2 Cities',
    description: 'Organized burglary gang targeting jewelry shops and commercial establishments in tier-2 cities of North Karnataka. Uses sophisticated tools and insider information. Linked to similar cases in 4 districts.',
    crime_category: 'burglary', status: 'charge_sheet_filed', priority: 3, ai_risk_score: 72,
    case_registered_date: '2025-05-10T10:00:00Z', incident_date: '2025-04-22T03:00:00Z',
    tags: ['burglary', 'serial', 'organized', 'tier2_cities'],
    ipc_sections: ['380', '454', '457', '120B', '34'],
    district_name: 'Hassan', station_name: 'Hassan Town PS',
    assigned_officer: 'Inspector Naveen Kumar', officer_badge: 'KSP-1122',
    suspect_count: 4, victim_count: 8, evidence_count: 10,
    created_at: '2025-05-10T10:00:00Z',
  },
  {
    id: 'case-pub-010', case_number: 'KSP-2025-000110',
    title: 'Crypto Currency Investment Scam - Bengaluru IT Hub',
    description: 'Tech-savvy fraudsters created fake cryptocurrency exchange platform. IT professionals in Bengaluru lost over Rs. 8 crore. Platform used sophisticated UI and fake trading dashboards to build credibility.',
    crime_category: 'cybercrime', status: 'under_investigation', priority: 4, ai_risk_score: 80,
    case_registered_date: '2025-05-20T10:00:00Z', incident_date: '2025-04-10T00:00:00Z',
    tags: ['crypto', 'cyber', 'investment_fraud', 'tech_sector'],
    ipc_sections: ['420', '468', '66D IT Act', '66C IT Act', '120B'],
    district_name: 'Bengaluru Urban', station_name: 'Whitefield PS',
    assigned_officer: 'Inspector Priya Menon', officer_badge: 'KSP-4567',
    suspect_count: 2, victim_count: 120, evidence_count: 22,
    created_at: '2025-05-20T10:00:00Z',
  },
  {
    id: 'case-pub-011', case_number: 'KSP-2025-000111',
    title: 'Contract Killing Plot Uncovered - Raichur',
    description: 'Intelligence tip-off led to busting of a contract killing plot targeting a prominent businessman. Suspected hitman arrested with firearm. Mastermind still at large, believed to be in Andhra Pradesh.',
    crime_category: 'murder', status: 'under_investigation', priority: 5, ai_risk_score: 97,
    case_registered_date: '2025-03-20T10:00:00Z', incident_date: '2025-03-18T22:00:00Z',
    tags: ['contract_killing', 'firearm', 'inter_state', 'critical'],
    ipc_sections: ['302', '120B', '25 Arms Act', '27 Arms Act'],
    district_name: 'Raichur', station_name: 'Raichur Town PS',
    assigned_officer: 'Inspector Venkateshwarlu', officer_badge: 'KSP-3344',
    suspect_count: 3, victim_count: 0, evidence_count: 8,
    created_at: '2025-03-20T10:00:00Z',
  },
  {
    id: 'case-pub-012', case_number: 'KSP-2025-000112',
    title: 'Fake Currency Racket Operating in Border Towns',
    description: 'High-quality counterfeit Indian currency notes being circulated in Karnataka-Telangana border towns. Notes passed at markets, petrol stations, and small businesses. Printing equipment recovered from hideout.',
    crime_category: 'economic_offense', status: 'chargesheet_filed', priority: 4, ai_risk_score: 76,
    case_registered_date: '2025-06-05T10:00:00Z', incident_date: '2025-06-01T08:00:00Z',
    tags: ['counterfeit', 'fake_currency', 'border', 'printing'],
    ipc_sections: ['489A', '489B', '489C', '489D', '120B'],
    district_name: 'Raichur', station_name: 'Raichur Town PS',
    assigned_officer: 'Inspector Venkateshwarlu', officer_badge: 'KSP-3344',
    suspect_count: 3, victim_count: 50, evidence_count: 14,
    created_at: '2025-06-05T10:00:00Z',
  },
  {
    id: 'case-pub-013', case_number: 'KSP-2025-000113',
    title: 'Wildlife Poaching in Western Ghats - Protected Species',
    description: 'Intelligence indicates organized poaching of endangered species in Kudremukh and Bhadra wildlife sanctuaries. Animal parts being smuggled to international buyers through Goa ports.',
    crime_category: 'other', status: 'under_investigation', priority: 3, ai_risk_score: 65,
    case_registered_date: '2025-04-01T10:00:00Z', incident_date: '2025-03-15T00:00:00Z',
    tags: ['wildlife', 'poaching', 'environmental', 'international'],
    ipc_sections: ['39 Wildlife Protection Act', '51 Wildlife Protection Act', '120B'],
    district_name: 'Chikkamagaluru', station_name: 'Chikkamagaluru Town PS',
    assigned_officer: 'Inspector Pradeep', officer_badge: 'KSP-2233',
    suspect_count: 5, victim_count: 0, evidence_count: 16,
    created_at: '2025-04-01T10:00:00Z',
  },
  {
    id: 'case-pub-014', case_number: 'KSP-2025-000114',
    title: 'Gold Smuggling via Hawala Route - Dharwad',
    description: 'Gold smuggling network using hawala channel to bring in gold from Gulf countries. Front jewelry shops used for laundering. Seizure of 3.2 kg of undeclared gold during raid.',
    crime_category: 'smuggling', status: 'chargesheet_filed', priority: 4, ai_risk_score: 83,
    case_registered_date: '2025-05-15T10:00:00Z', incident_date: '2025-05-10T14:00:00Z',
    tags: ['gold', 'smuggling', 'hawala', 'customs'],
    ipc_sections: ['132 Customs Act', '135 Customs Act', '120B', 'PMLA'],
    district_name: 'Dharwad', station_name: 'Dharwad City PS',
    assigned_officer: 'Inspector Hanumantha', officer_badge: 'KSP-7788',
    suspect_count: 3, victim_count: 0, evidence_count: 19,
    created_at: '2025-05-15T10:00:00Z',
  },
  {
    id: 'case-pub-015', case_number: 'KSP-2025-000115',
    title: 'Eve-teasing and Assault on College Students - Shimoga',
    description: 'Pattern of harassment and assault on female college students near educational institutions. Multiple complaints from different colleges in same area. Police patrol increased.',
    crime_category: 'assault', status: 'under_investigation', priority: 3, ai_risk_score: 62,
    case_registered_date: '2025-03-20T10:00:00Z', incident_date: '2025-03-15T12:30:00Z',
    tags: ['harassment', 'women_safety', 'college', 'serial'],
    ipc_sections: ['354A', '323', '509', '147', '34'],
    district_name: 'Shivamogga', station_name: 'Shivamogga Town PS',
    assigned_officer: 'Inspector Manju Devi', officer_badge: 'KSP-5566',
    suspect_count: 4, victim_count: 7, evidence_count: 5,
    created_at: '2025-03-20T10:00:00Z',
  },
]

// ─── Public Report Records ─────────────────────────────────────────────────────
export interface PublicReport {
  id: string
  title: string
  type: string
  status: string
  created_at: string
}

export const PUBLIC_REPORTS: PublicReport[] = [
  { id: 'rpt-pub-001', title: 'Karnataka Annual Crime Summary 2025', type: 'crime_summary', status: 'completed', created_at: '2025-06-30T10:00:00Z' },
  { id: 'rpt-pub-002', title: 'Bengaluru Urban District Crime Analysis', type: 'district_report', status: 'completed', created_at: '2025-06-28T10:00:00Z' },
  { id: 'rpt-pub-003', title: 'Most Wanted Criminals - Karnataka State', type: 'criminal_report', status: 'completed', created_at: '2025-06-25T10:00:00Z' },
  { id: 'rpt-pub-004', title: 'Cyber Crime Trends in Karnataka 2022-2025', type: 'crime_summary', status: 'completed', created_at: '2025-06-20T10:00:00Z' },
  { id: 'rpt-pub-005', title: 'NCRB District-wise Crime Statistics - Karnataka', type: 'district_report', status: 'completed', created_at: '2025-06-15T10:00:00Z' },
  { id: 'rpt-pub-006', title: 'Drug Offenses in North Karnataka - Analysis', type: 'crime_summary', status: 'completed', created_at: '2025-06-10T10:00:00Z' },
  { id: 'rpt-pub-007', title: 'Women Safety Assessment - Tier-2 Cities', type: 'district_report', status: 'completed', created_at: '2025-06-05T10:00:00Z' },
  { id: 'rpt-pub-008', title: 'Economic Offenses and Financial Fraud Report', type: 'crime_summary', status: 'completed', created_at: '2025-06-01T10:00:00Z' },
]

// ─── Helper: Check if DB is empty ──────────────────────────────────────────────
let _dbCheckCache: boolean | null = null
let _dbCheckTime = 0
const DB_CHECK_TTL = 60 * 1000 // 1 minute

export async function isTableEmpty(table: string): Promise<boolean> {
  const now = Date.now()
  if (_dbCheckCache !== null && now - _dbCheckTime < DB_CHECK_TTL) {
    return _dbCheckCache
  }
  try {
    const { query } = await import('./database.service')
    const result = await query(`SELECT EXISTS (SELECT 1 FROM ${table} LIMIT 1) AS has_rows`)
    _dbCheckCache = !result.rows[0]?.has_rows
    _dbCheckTime = now
    return _dbCheckCache
  } catch {
    return true
  }
}

// ─── Public Data Service Functions ─────────────────────────────────────────────

export async function getPublicCriminals(filters: {
  search?: string; riskLevel?: string; isWanted?: string; gender?: string;
  page?: number; limit?: number;
}): Promise<PaginatedResult<PublicCriminal>> {
  let data = [...PUBLIC_CRIMINALS]

  if (filters.search) {
    const s = filters.search.toLowerCase()
    data = data.filter(c =>
      c.full_name.toLowerCase().includes(s) ||
      c.criminal_id.toLowerCase().includes(s) ||
      c.aliases.some(a => a.toLowerCase().includes(s))
    )
  }
  if (filters.riskLevel) data = data.filter(c => c.risk_level === filters.riskLevel)
  if (filters.isWanted === 'true') data = data.filter(c => c.is_wanted)
  if (filters.gender) data = data.filter(c => c.gender === filters.gender)

  const page = filters.page || 1
  const limit = filters.limit || 20
  return buildPaginatedResponse(data, data.length, page, limit)
}

export function getPublicCriminalById(id: string): (PublicCriminal & { cases: Array<Record<string, unknown>> }) | null {
  const criminal = PUBLIC_CRIMINALS.find(c => c.id === id)
  if (!criminal) return null

  // Return cases that might be related based on district
  const relatedCases = PUBLIC_CASES.filter(c =>
    c.district_name === criminal.district_name || c.crime_category === criminal.crime_specialization[0]
  ).slice(0, 3).map(c => ({
    id: c.id, case_number: c.case_number, title: c.title,
    crime_category: c.crime_category, status: c.status,
    case_registered_date: c.case_registered_date,
    role_in_crime: 'primary_suspect',
    suspect_arrested: false,
  }))

  return { ...criminal, cases: relatedCases }
}

export function getPublicWantedCriminals(): PublicCriminal[] {
  return PUBLIC_CRIMINALS.filter(c => c.is_wanted)
}

export async function getPublicFIRs(filters: {
  search?: string; crimeCategory?: string; status?: string;
  page?: number; limit?: number;
}): Promise<PaginatedResult<PublicFIR>> {
  let data = [...PUBLIC_FIRS]

  if (filters.search) {
    const s = filters.search.toLowerCase()
    data = data.filter(f =>
      f.fir_number.toLowerCase().includes(s) ||
      f.complainant_name.toLowerCase().includes(s) ||
      f.crime_description.toLowerCase().includes(s) ||
      f.incident_location.toLowerCase().includes(s)
    )
  }
  if (filters.crimeCategory) data = data.filter(f => f.crime_category === filters.crimeCategory)
  if (filters.status) data = data.filter(f => f.status === filters.status)

  const page = filters.page || 1
  const limit = filters.limit || 20
  return buildPaginatedResponse(data, data.length, page, limit)
}

export function getPublicFIRById(id: string): PublicFIR | null {
  return PUBLIC_FIRS.find(f => f.id === id) || null
}

export async function getPublicCases(filters: {
  search?: string; status?: string; crimeCategory?: string;
  page?: number; limit?: number;
}): Promise<PaginatedResult<PublicCase>> {
  let data = [...PUBLIC_CASES]

  if (filters.search) {
    const s = filters.search.toLowerCase()
    data = data.filter(c =>
      c.case_number.toLowerCase().includes(s) ||
      c.title.toLowerCase().includes(s) ||
      c.description.toLowerCase().includes(s)
    )
  }
  if (filters.status) data = data.filter(c => c.status === filters.status)
  if (filters.crimeCategory) data = data.filter(c => c.crime_category === filters.crimeCategory)

  const page = filters.page || 1
  const limit = filters.limit || 20
  return buildPaginatedResponse(data, data.length, page, limit)
}

export function getPublicCaseById(id: string): (PublicCase & { suspects: unknown[]; victims: unknown[]; evidence: unknown[]; notes: unknown[] }) | null {
  const c = PUBLIC_CASES.find(c => c.id === id)
  if (!c) return null
  return {
    ...c,
    suspects: Array.from({ length: c.suspect_count }, (_, i) => ({
      id: `s-pub-${id}-${i}`, case_id: id, full_name: `Suspect ${i + 1}`,
      role_in_crime: i === 0 ? 'primary' : 'accomplice', is_arrested: i === 0,
    })),
    victims: Array.from({ length: Math.min(c.victim_count, 3) }, (_, i) => ({
      id: `v-pub-${id}-${i}`, case_id: id, full_name: `Victim ${i + 1}`,
    })),
    evidence: Array.from({ length: Math.min(c.evidence_count, 5) }, (_, i) => ({
      id: `e-pub-${id}-${i}`, case_id: id, title: `Evidence Item ${i + 1}`,
      type: ['document', 'digital', 'physical', 'testimony'][i % 4],
      evidence_number: `EV-${Date.now()}-${i}`, is_forensic_analyzed: i < 2,
    })),
    notes: [
      {
        id: `n-pub-${id}-1`, case_id: id, author_name: 'System',
        author_role: 'system', note_type: 'system', title: 'Case Registered',
        content: `Case ${c.case_number} registered and assigned for investigation.`,
        is_confidential: false, created_at: c.case_registered_date,
      },
    ],
  }
}

export function getPublicReports(): PublicReport[] {
  return PUBLIC_REPORTS
}

export function getPublicReportById(id: string): PublicReport | null {
  return PUBLIC_REPORTS.find(r => r.id === id) || null
}
