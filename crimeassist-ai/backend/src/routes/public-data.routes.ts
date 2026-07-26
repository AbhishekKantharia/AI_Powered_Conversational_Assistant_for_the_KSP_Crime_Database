import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import { rateLimitGeneral } from '../middleware/rateLimit.middleware'
import {
  fetchIPCSections,
  searchIPCSections,
  getIPCSectionByNumber,
  fetchKarnatakaCrimeStats,
  getKarnatakaDistricts,
  fetchPoliceStations,
} from '../services/publicData.service'
import { logger } from '../utils/logger'

const router = Router()
router.use(authenticate, rateLimitGeneral)

// ─── GET /public-data/ipc-sections ─────────────────────────────────────────────
router.get('/ipc-sections', requirePermission('ai:chat'), async (_req, res) => {
  try {
    const sections = await fetchIPCSections()
    res.json({ success: true, data: sections, count: sections.length })
  } catch (error) {
    logger.error('Failed to fetch IPC sections:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch IPC sections' })
  }
})

// ─── GET /public-data/ipc-search?q=420 ────────────────────────────────────────
router.get('/ipc-search', requirePermission('ai:chat'), async (req, res) => {
  try {
    const q = (req.query.q as string) || ''
    if (q.length < 1) {
      res.status(400).json({ success: false, error: 'Search query is required' })
      return
    }
    const sections = await searchIPCSections(q)
    res.json({ success: true, data: sections, count: sections.length })
  } catch (error) {
    logger.error('IPC search failed:', error)
    res.status(500).json({ success: false, error: 'IPC search failed' })
  }
})

// ─── GET /public-data/ipc/:sectionNumber ──────────────────────────────────────
router.get('/ipc/:sectionNumber', requirePermission('ai:chat'), async (req, res) => {
  try {
    const section = await getIPCSectionByNumber(req.params.sectionNumber)
    if (!section) {
      res.status(404).json({ success: false, error: 'IPC section not found' })
      return
    }
    res.json({ success: true, data: section })
  } catch (error) {
    logger.error('IPC lookup failed:', error)
    res.status(500).json({ success: false, error: 'IPC lookup failed' })
  }
})

// ─── GET /public-data/karnataka-crime-stats ────────────────────────────────────
router.get('/karnataka-crime-stats', requirePermission('analytics:read'), async (_req, res) => {
  try {
    const stats = await fetchKarnatakaCrimeStats()
    res.json({ success: true, data: stats, count: stats.length })
  } catch (error) {
    logger.error('Failed to fetch Karnataka crime stats:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch crime statistics' })
  }
})

// ─── GET /public-data/karnataka-districts ──────────────────────────────────────
router.get('/karnataka-districts', requirePermission('analytics:read'), async (_req, res) => {
  try {
    const districts = await getKarnatakaDistricts()
    res.json({ success: true, data: districts, count: districts.length })
  } catch (error) {
    logger.error('Failed to fetch districts:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch districts' })
  }
})

// ─── GET /public-data/police-stations ──────────────────────────────────────────
router.get('/police-stations', requirePermission('analytics:read'), async (_req, res) => {
  try {
    const stations = await fetchPoliceStations()
    res.json({ success: true, data: stations, count: stations.length })
  } catch (error) {
    logger.error('Failed to fetch police stations:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch police stations' })
  }
})

// ─── GET /public-data/ncrb-summary ────────────────────────────────────────────
router.get('/ncrb-summary', requirePermission('analytics:read'), async (_req, res) => {
  try {
    const stats = await fetchKarnatakaCrimeStats()
    const totalCrime = stats.reduce((sum, d) => sum + d.totalCrime, 0)
    const byCategory: Record<string, number> = {}
    for (const s of stats) {
      for (const [key, val] of Object.entries(s)) {
        if (key !== 'district' && key !== 'totalCrime' && typeof val === 'number') {
          byCategory[key] = (byCategory[key] || 0) + val
        }
      }
    }
    const topDistricts = [...stats].sort((a, b) => b.totalCrime - a.totalCrime).slice(0, 5)

    res.json({
      success: true,
      data: {
        totalCrime,
        districts: stats.length,
        byCategory,
        topDistricts,
        source: 'NCRB Crime in India / Indian Data Project',
      },
    })
  } catch (error) {
    logger.error('NCRB summary failed:', error)
    res.status(500).json({ success: false, error: 'Failed to generate NCRB summary' })
  }
})

export default router
