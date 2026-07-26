"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const database_service_1 = require("../services/database.service");
const publicData_service_1 = require("../services/publicData.service");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("./logger");
const CRIME_CATEGORIES = [
    'cybercrime', 'robbery', 'burglary', 'theft', 'fraud',
    'assault', 'kidnapping', 'drug_offense', 'murder', 'property_crime',
];
async function seedDatabase() {
    logger_1.logger.info('Starting Karnataka State Police Database Seed Process...');
    await (0, database_service_1.connectDB)();
    try {
        // ─── Fetch all data from public APIs ──────────────────────────────────────
        logger_1.logger.info('Fetching Karnataka districts from public APIs...');
        const apiDistricts = await (0, publicData_service_1.getKarnatakaDistricts)();
        if (apiDistricts.length === 0) {
            throw new Error('Failed to fetch Karnataka districts from any public API. Cannot seed.');
        }
        logger_1.logger.info(`Fetched ${apiDistricts.length} districts from public API`);
        logger_1.logger.info('Fetching Karnataka police stations from public APIs...');
        const apiStations = await (0, publicData_service_1.fetchPoliceStations)();
        logger_1.logger.info(`Fetched ${apiStations.length} police stations from public API`);
        logger_1.logger.info('Fetching IPC sections from public APIs...');
        const apiIPC = await (0, publicData_service_1.fetchIPCSections)();
        logger_1.logger.info(`Fetched ${apiIPC.length} IPC sections from public API`);
        // Build IPC category mapping from real data
        const ipcByCrime = buildIPCCategoryMap(apiIPC);
        // ─── 1. Seed Districts from API data ──────────────────────────────────────
        const districtIds = [];
        for (const d of apiDistricts) {
            const res = await (0, database_service_1.query)(`INSERT INTO districts (name, code, latitude, longitude, population, area_sq_km, headquarters, division)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (name) DO UPDATE SET
           latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
           population = EXCLUDED.population, area_sq_km = EXCLUDED.area_sq_km,
           updated_at = NOW()
         RETURNING id`, [d.name, d.code, d.lat, d.lng, d.population, d.areaSqKm, d.headquarters, d.division]);
            districtIds.push(res.rows[0].id);
        }
        logger_1.logger.info(`Seeded ${districtIds.length} Districts from public API`);
        // ─── 2. Seed Police Stations from API data ────────────────────────────────
        const stationIds = [];
        if (apiStations.length > 0) {
            for (let i = 0; i < apiStations.length; i++) {
                const ps = apiStations[i];
                // Match station to district by name
                const matchedDistIdx = apiDistricts.findIndex((d) => d.name.toLowerCase() === ps.district.toLowerCase());
                const distId = matchedDistIdx >= 0 ? districtIds[matchedDistIdx] : districtIds[i % districtIds.length];
                const res = await (0, database_service_1.query)(`INSERT INTO police_stations (name, code, district_id, phone)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (code) DO UPDATE SET updated_at = NOW()
           RETURNING id`, [ps.name, ps.code || `PS-${String(i + 1).padStart(4, '0')}`, distId, ps.phone || '']);
                stationIds.push(res.rows[0].id);
            }
        }
        else {
            // If no stations from API, create one per district
            for (let i = 0; i < apiDistricts.length; i++) {
                const psName = `${apiDistricts[i].name} District Police Station`;
                const res = await (0, database_service_1.query)(`INSERT INTO police_stations (name, code, district_id, phone)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (code) DO UPDATE SET updated_at = NOW()
           RETURNING id`, [psName, `PS-${String(i + 1).padStart(4, '0')}`, districtIds[i], '']);
                stationIds.push(res.rows[0].id);
            }
        }
        logger_1.logger.info(`Seeded ${stationIds.length} Police Stations from public API`);
        // ─── 3. Seed Users ────────────────────────────────────────────────────────
        const passwordHash = await bcryptjs_1.default.hash('password123', 10);
        const adminUser = await (0, database_service_1.query)(`INSERT INTO users (badge_number, username, email, password_hash, full_name, role, status, district_id, station_id)
       VALUES ('KSP-0001', 'admin_ksp', 'admin@ksp.gov.in', $1, 'Director General of Police', 'administrator', 'active', $2, $3)
       ON CONFLICT (username) DO UPDATE SET updated_at = NOW()
       RETURNING id`, [passwordHash, districtIds[0], stationIds[0]]);
        const officerUser = await (0, database_service_1.query)(`INSERT INTO users (badge_number, username, email, password_hash, full_name, role, status, district_id, station_id)
       VALUES ('KSP-8821', 'officer_ksp', 'officer@ksp.gov.in', $1, 'Inspector Rajesh Kumar', 'investigation_officer', 'active', $2, $3)
       ON CONFLICT (username) DO UPDATE SET updated_at = NOW()
       RETURNING id`, [passwordHash, districtIds[0], stationIds[0]]);
        logger_1.logger.info('Seeded Admin & Officer Users');
        // ─── 4. Seed Criminal Profiles ────────────────────────────────────────────
        logger_1.logger.info('Seeding 200 Criminal Profiles...');
        for (let i = 1; i <= 200; i++) {
            const crId = `KSP-CR-2026-${String(i).padStart(4, '0')}`;
            const isWanted = i <= 30;
            const riskLevel = i <= 15 ? 'critical' : i <= 45 ? 'high' : i <= 100 ? 'medium' : 'low';
            const riskScore = i <= 15 ? 90 + (i % 10) : i <= 45 ? 75 + (i % 15) : 50;
            const distIdx = i % apiDistricts.length;
            const crimeCat = CRIME_CATEGORIES[i % CRIME_CATEGORIES.length];
            const moIPC = ipcByCrime[crimeCat] || ipcByCrime.other || [];
            await (0, database_service_1.query)(`INSERT INTO criminals (criminal_id, full_name, aliases, age, gender, risk_level, risk_score, is_wanted, reward_amount, district_id, modus_operandi, crime_specialization)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (criminal_id) DO NOTHING`, [
                crId,
                `Criminal Suspect ${i}`,
                [`Alias_${i}`],
                22 + (i % 30),
                i % 10 === 0 ? 'female' : 'male',
                riskLevel,
                riskScore,
                isWanted,
                isWanted ? 50000 + i * 1000 : null,
                districtIds[distIdx],
                `Known for ${crimeCat.replace(/_/g, ' ')} in ${apiDistricts[distIdx]?.name || 'Karnataka'}. Associated IPC: ${moIPC.join(', ')}.`,
                [crimeCat],
            ]);
        }
        logger_1.logger.info('Seeded 200 Criminal Profiles');
        // ─── 5. Seed FIR Records ──────────────────────────────────────────────────
        logger_1.logger.info('Seeding 1000 FIR Records...');
        for (let i = 1; i <= 1000; i++) {
            const firNum = `FIR/KSP/2026/${String(i).padStart(5, '0')}`;
            const category = CRIME_CATEGORIES[i % CRIME_CATEGORIES.length];
            const status = i % 4 === 0 ? 'chargesheeted' : i % 3 === 0 ? 'under_investigation' : 'filed';
            const distIdx = i % apiDistricts.length;
            const ipcSections = ipcByCrime[category] || ['IPC 420'];
            const daysAgo = i % 365;
            await (0, database_service_1.query)(`INSERT INTO fir (fir_number, station_id, district_id, complainant_name, incident_date, incident_location, crime_category, crime_description, ipc_sections, status, registered_by)
         VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${daysAgo} days', $5, $6, $7, $8, $9, $10)
         ON CONFLICT (fir_number) DO NOTHING`, [
                firNum,
                stationIds[i % stationIds.length],
                districtIds[distIdx],
                `Complainant ${i}`,
                `Location ${i}, ${apiDistricts[distIdx]?.name || 'Karnataka'}`,
                category,
                `${category.replace(/_/g, ' ').toUpperCase()} incident reported in ${apiDistricts[distIdx]?.name || 'Karnataka'}. IPC: ${ipcSections.join(', ')}.`,
                ipcSections,
                status,
                officerUser.rows[0].id,
            ]);
        }
        logger_1.logger.info('Seeded 1000 FIR Records');
        // ─── 6. Seed Cases ────────────────────────────────────────────────────────
        logger_1.logger.info('Seeding 500 Case Files...');
        for (let i = 1; i <= 500; i++) {
            const caseNum = `KSP-2026-${String(i).padStart(4, '0')}`;
            const category = CRIME_CATEGORIES[i % CRIME_CATEGORIES.length];
            const status = i % 5 === 0 ? 'closed' : i % 3 === 0 ? 'under_investigation' : 'registered';
            const ipcSections = ipcByCrime[category] || ['IPC 420'];
            const distIdx = i % apiDistricts.length;
            await (0, database_service_1.query)(`INSERT INTO cases (case_number, title, description, crime_category, status, priority, district_id, station_id, assigned_officer_id, ai_risk_score, ipc_sections)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (case_number) DO NOTHING`, [
                caseNum,
                `Investigation of ${category.replace(/_/g, ' ')} Incident in ${apiDistricts[distIdx]?.name || 'Karnataka'}`,
                `Case file for ${category.replace(/_/g, ' ')} incident #${i} in ${apiDistricts[distIdx]?.name || 'Karnataka'}. IPC: ${ipcSections.join(', ')}.`,
                category,
                status,
                (i % 5) + 1,
                districtIds[distIdx],
                stationIds[i % stationIds.length],
                officerUser.rows[0].id,
                40 + (i % 55),
                ipcSections,
            ]);
        }
        logger_1.logger.info('Seeded 500 Case Files');
        logger_1.logger.info('✅ Complete KSP Database Seeding Finished Successfully!');
    }
    catch (err) {
        logger_1.logger.error('Database seeding error:', err);
    }
    finally {
        await (0, database_service_1.disconnectDB)();
    }
}
// Build IPC section mapping by crime category from real IPC data
function buildIPCCategoryMap(ipcSections) {
    const map = {};
    const categoryKeywords = {
        cybercrime: ['computer', 'electronic', 'cyber', 'digital', 'internet', 'software', 'system', 'data'],
        robbery: ['robbery', 'dacoity', 'extortion', 'force'],
        burglary: ['burglary', 'house trespass', 'house breaking', 'breaking open'],
        theft: ['theft', 'stolen property', 'dishonest misappropriation'],
        fraud: ['cheating', 'fraud', 'dishonestly inducing', 'criminal breach of trust'],
        assault: ['hurt', 'grievous hurt', 'assault', 'criminal force', 'riot'],
        kidnapping: ['kidnapping', 'abduction', 'wrongful confinement'],
        drug_offense: ['drug', 'narcotic', 'ndps', 'intoxicating'],
        murder: ['murder', 'culpable homicide', 'death', 'homicide'],
        property_crime: ['criminal trespass', 'mischief', 'property', 'destruction'],
    };
    for (const section of ipcSections) {
        const lower = `${section.title} ${section.description} ${section.category}`.toLowerCase();
        for (const [crimeCat, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some((kw) => lower.includes(kw))) {
                if (!map[crimeCat])
                    map[crimeCat] = [];
                if (map[crimeCat].length < 5) {
                    map[crimeCat].push(`IPC ${section.section}`);
                }
            }
        }
    }
    // Ensure every category has at least one IPC section
    for (const cat of Object.keys(categoryKeywords)) {
        if (!map[cat] || map[cat].length === 0) {
            map[cat] = ['IPC 420'];
        }
    }
    return map;
}
if (require.main === module) {
    seedDatabase();
}
//# sourceMappingURL=seed.js.map