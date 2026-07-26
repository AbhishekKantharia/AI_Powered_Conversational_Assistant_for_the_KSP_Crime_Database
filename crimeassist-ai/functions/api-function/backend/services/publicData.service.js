"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchIPCSections = fetchIPCSections;
exports.fetchKarnatakaCrimeStats = fetchKarnatakaCrimeStats;
exports.getKarnatakaDistricts = getKarnatakaDistricts;
exports.fetchPoliceStations = fetchPoliceStations;
exports.searchIPCSections = searchIPCSections;
exports.getIPCSectionByNumber = getIPCSectionByNumber;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
// ─── Cache ─────────────────────────────────────────────────────────────────────
let ipcCache = null;
let ncrbCache = null;
let ipcCacheTime = 0;
let ncrbCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
// ─── IPC Sections (from Indian Law JSON on GitHub) ─────────────────────────────
const IPC_JSON_URLS = [
    'https://raw.githubusercontent.com/civictech-India/Indian-Law-Penal-Code-Json/main/ipc.json',
    'https://raw.githubusercontent.com/civictech-India/Indian-Law-Penal-Code-Json/master/ipc.json',
    'https://raw.githubusercontent.com/civictech-India/Indian-Law-Penal-Code-Json/refs/heads/main/ipc.json',
];
async function fetchIPCSections() {
    if (ipcCache && Date.now() - ipcCacheTime < CACHE_TTL) {
        return ipcCache;
    }
    let lastError = null;
    for (const url of IPC_JSON_URLS) {
        try {
            logger_1.logger.info(`Fetching IPC sections from ${url}...`);
            const response = await axios_1.default.get(url, { timeout: 20000 });
            const data = response.data;
            if (Array.isArray(data)) {
                ipcCache = data.map((item) => ({
                    section: String(item.section || item.Section || item['Section Number'] || ''),
                    title: String(item.title || item.Title || item['Section Title'] || ''),
                    description: String(item.description || item.Description || item.punishment || ''),
                    punishment: String(item.punishment || item.Punishment || ''),
                    category: String(item.category || item.chapter || ''),
                })).filter((s) => s.section && s.title);
            }
            else if (typeof data === 'object' && data !== null) {
                ipcCache = parseIPCObject(data);
            }
            if (ipcCache && ipcCache.length > 0) {
                ipcCacheTime = Date.now();
                logger_1.logger.info(`Fetched ${ipcCache.length} IPC sections from public API`);
                return ipcCache;
            }
        }
        catch (error) {
            lastError = error;
            logger_1.logger.warn(`IPC fetch failed from ${url}:`, error);
        }
    }
    // Last resort: try the Indian Kanoon API for IPC data
    try {
        logger_1.logger.info('Trying Indian Kanoon API for IPC sections...');
        const response = await axios_1.default.get('https://api.indiankanoon.org/statute/', {
            timeout: 20000,
            headers: { Accept: 'application/json' },
        });
        if (response.data && Array.isArray(response.data.results)) {
            ipcCache = response.data.results
                .filter((r) => String(r.title || '').includes('Indian Penal Code'))
                .map((r) => ({
                section: String(r.section || ''),
                title: String(r.title || ''),
                description: String(r.doc || ''),
                punishment: '',
                category: 'IPC',
            }))
                .filter((s) => s.section);
            if (ipcCache && ipcCache.length > 0) {
                ipcCacheTime = Date.now();
                return ipcCache;
            }
        }
    }
    catch { }
    logger_1.logger.error('All IPC API sources failed. No embedded fallback.', lastError);
    return [];
}
function parseIPCObject(obj) {
    const sections = [];
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const v = value;
            sections.push({
                section: String(v.section || key),
                title: String(v.title || v.name || key),
                description: String(v.description || v.punishment || ''),
                punishment: String(v.punishment || ''),
                category: String(v.category || v.chapter || ''),
            });
        }
    }
    return sections;
}
// ─── Karnataka NCRB Crime Statistics ───────────────────────────────────────────
const NCRB_API_URLS = [
    'https://indiandataproject.org/data/crime/2025-26/summary.json',
    'https://indiandataproject.org/data/crime/2025-26/overview.json',
    'https://indiandataproject.org/data/crime/2024-25/summary.json',
    'https://indiandataproject.org/data/crime/2024-25/overview.json',
];
async function fetchKarnatakaCrimeStats() {
    if (ncrbCache && Date.now() - ncrbCacheTime < CACHE_TTL) {
        return ncrbCache;
    }
    for (const url of NCRB_API_URLS) {
        try {
            logger_1.logger.info(`Fetching NCRB data from ${url}...`);
            const response = await axios_1.default.get(url, { timeout: 20000 });
            const data = response.data;
            const parsed = parseNCRBData(data);
            if (parsed.length > 0) {
                ncrbCache = parsed;
                ncrbCacheTime = Date.now();
                logger_1.logger.info(`Loaded NCRB data for ${parsed.length} Karnataka districts`);
                return ncrbCache;
            }
        }
        catch (error) {
            logger_1.logger.warn(`NCRB fetch failed from ${url}:`, error);
        }
    }
    // Try data.gov.in NCRB dataset
    try {
        logger_1.logger.info('Trying data.gov.in for NCRB crime statistics...');
        const response = await axios_1.default.get('https://data.gov.in/backend/dmspublic/v1/resources?filters%5Bgroup%5D=crime-in-india&offset=0&limit=50', { timeout: 20000 });
        if (response.data?.data) {
            const karnatakaData = response.data.data.filter((r) => String(r.title || '').toLowerCase().includes('karnataka'));
            if (karnatakaData.length > 0) {
                ncrbCache = karnatakaData.map((d) => ({
                    district: String(d.district || d.title || 'Karnataka'),
                    totalCrime: Number(d.total_crime || d.totalCrime || 0),
                    murder: Number(d.murder || 0),
                    robbery: Number(d.robbery || 0),
                    theft: Number(d.theft || 0),
                    burglary: Number(d.burglary || 0),
                    cybercrime: Number(d.cybercrime || 0),
                    fraud: Number(d.fraud || 0),
                    assault: Number(d.assault || 0),
                    kidnapping: Number(d.kidnapping || 0),
                    drugOffense: Number(d.drug_offense || 0),
                }));
                ncrbCacheTime = Date.now();
                return ncrbCache;
            }
        }
    }
    catch { }
    logger_1.logger.error('All NCRB API sources failed. No embedded fallback available.');
    return [];
}
function parseNCRBData(data) {
    const results = [];
    try {
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            for (const [key, value] of Object.entries(data)) {
                if (typeof value === 'object' && value !== null) {
                    const v = value;
                    const isKarnataka = String(v.state || '').toLowerCase().includes('karnataka') || key.toLowerCase().includes('karnataka');
                    if (isKarnataka) {
                        results.push({
                            district: String(v.district || key),
                            totalCrime: Number(v.total_crime || v.totalCrime || 0),
                            murder: Number(v.murder || 0),
                            robbery: Number(v.robbery || 0),
                            theft: Number(v.theft || 0),
                            burglary: Number(v.burglary || 0),
                            cybercrime: Number(v.cybercrime || 0),
                            fraud: Number(v.fraud || 0),
                            assault: Number(v.assault || 0),
                            kidnapping: Number(v.kidnapping || 0),
                            drugOffense: Number(v.drug_offense || 0),
                        });
                    }
                }
            }
        }
        else if (Array.isArray(data)) {
            for (const item of data) {
                if (typeof item === 'object' && item !== null) {
                    const v = item;
                    if (String(v.state || '').toLowerCase().includes('karnataka')) {
                        results.push({
                            district: String(v.district || v.region || 'Karnataka'),
                            totalCrime: Number(v.total || v.total_crime || 0),
                            murder: Number(v.murder || 0),
                            robbery: Number(v.robbery || 0),
                            theft: Number(v.theft || 0),
                            burglary: Number(v.burglary || 0),
                            cybercrime: Number(v.cybercrime || 0),
                            fraud: Number(v.fraud || 0),
                            assault: Number(v.assault || 0),
                            kidnapping: Number(v.kidnapping || 0),
                            drugOffense: Number(v.drug_offense || 0),
                        });
                    }
                }
            }
        }
    }
    catch { }
    return results;
}
async function getKarnatakaDistricts() {
    try {
        // Try Census 2011 API for Karnataka district data
        logger_1.logger.info('Fetching Karnataka districts from Census/India Post API...');
        const response = await axios_1.default.get('https://api.censusindia.gov.in/api/getData?key=&name=district&state=29', { timeout: 20000 });
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            return response.data.map((d) => ({
                name: String(d.name || d.district || ''),
                code: String(d.code || d.district_code || ''),
                lat: Number(d.latitude || d.lat || 0),
                lng: Number(d.longitude || d.lng || d.lon || 0),
                population: Number(d.population || 0),
                areaSqKm: Number(d.area || d.area_sq_km || 0),
                headquarters: String(d.headquarters || d.hq || d.name || ''),
                division: String(d.division || 'Karnataka'),
            })).filter((d) => d.name);
        }
    }
    catch { }
    try {
        // Try India Post API for Karnataka districts
        const response = await axios_1.default.get('https://api.postalpincode.in/state/Karnataka', { timeout: 20000 });
        if (response.data?.[0]?.PostOffice) {
            const districtMap = new Map();
            for (const po of response.data[0].PostOffice) {
                if (!districtMap.has(po.District)) {
                    districtMap.set(po.District, po);
                }
            }
            return Array.from(districtMap.entries()).map(([name, _po]) => ({
                name,
                code: name.substring(0, 3).toUpperCase(),
                lat: 0,
                lng: 0,
                population: 0,
                areaSqKm: 0,
                headquarters: name,
                division: 'Karnataka',
            }));
        }
    }
    catch { }
    try {
        // Try data.gov.in Karnataka districts
        const response = await axios_1.default.get('https://data.gov.in/backend/dmspublic/v1/resources?filters%5Bgroup%5D=karnataka-districts&offset=0&limit=50', { timeout: 20000 });
        if (response.data?.data) {
            return response.data.data.map((d) => ({
                name: String(d.name || d.district || ''),
                code: String(d.code || ''),
                lat: Number(d.latitude || d.lat || 0),
                lng: Number(d.longitude || d.lng || 0),
                population: Number(d.population || 0),
                areaSqKm: Number(d.area || 0),
                headquarters: String(d.headquarters || d.name || ''),
                division: String(d.division || 'Karnataka'),
            })).filter((d) => d.name);
        }
    }
    catch { }
    logger_1.logger.error('All district API sources failed');
    return [];
}
async function fetchPoliceStations() {
    try {
        logger_1.logger.info('Fetching Karnataka police stations from public data...');
        const response = await axios_1.default.get('https://data.opencity.in/dataset/police-station-locations/resource.json', { timeout: 20000 });
        if (Array.isArray(response.data)) {
            return response.data
                .filter((ps) => String(ps.state || '').toLowerCase().includes('karnataka'))
                .map((ps) => ({
                name: String(ps.name || ps.station_name || ''),
                code: String(ps.code || ps.station_code || ''),
                district: String(ps.district || ''),
                lat: Number(ps.latitude || ps.lat || 0),
                lng: Number(ps.longitude || ps.lng || 0),
                phone: String(ps.phone || ps.contact || ''),
            }))
                .filter((ps) => ps.name);
        }
    }
    catch { }
    try {
        // Try OpenStreetMap Overpass API for Karnataka police stations
        const query = `[out:json];area["name"="Karnataka"]->.karnataka;(node["amenity"="police"](area.karnataka);way["amenity"="police"](area.karnataka););out center;`;
        const response = await axios_1.default.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(query)}`, { timeout: 30000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        if (response.data?.elements) {
            return response.data.elements.map((el) => {
                const tags = (el.tags || {});
                const lat = Number(el.lat || el.center?.lat || 0);
                const lng = Number(el.lon || el.center?.lon || 0);
                return {
                    name: String(tags.name || ''),
                    code: `PS-${String(el.id).padStart(4, '0')}`,
                    district: String(tags['addr:district'] || ''),
                    lat,
                    lng,
                    phone: String(tags.phone || tags['contact:phone'] || ''),
                };
            }).filter((ps) => ps.name);
        }
    }
    catch { }
    logger_1.logger.error('All police station API sources failed');
    return [];
}
// ─── IPC Lookup Helpers ────────────────────────────────────────────────────────
async function searchIPCSections(queryText) {
    const all = await fetchIPCSections();
    const q = queryText.toLowerCase();
    return all.filter((s) => s.section.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.punishment?.toLowerCase().includes(q)).slice(0, 20);
}
async function getIPCSectionByNumber(sectionNumber) {
    const all = await fetchIPCSections();
    const clean = sectionNumber.replace(/[^0-9]/g, '');
    return all.find((s) => s.section.replace(/[^0-9]/g, '') === clean);
}
//# sourceMappingURL=publicData.service.js.map