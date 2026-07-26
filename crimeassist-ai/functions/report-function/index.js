const catalyst = require('zcatalyst-sdk-node')
const { Pool } = require('pg')
const PDFDocument = require('pdfkit')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'crimeassist_db',
  user: process.env.DB_USER || 'crimeassist',
  password: process.env.DB_PASSWORD || 'your_secure_password',
})

module.exports = async function reportHandler(req, res) {
  const client = await pool.connect()
  try {
    const { type, filters, title } = req.body

    let reportData = {}
    let docTitle = title || 'CrimeAssist AI Report'

    switch (type) {
      case 'crime_summary': {
        const result = await client.query(`
          SELECT crime_category, status, COUNT(*) AS count
          FROM fir
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY crime_category, status
          ORDER BY count DESC
        `)
        reportData = { summary: result.rows, period: 'Last 30 days' }
        break
      }
      case 'district_report': {
        const result = await client.query(`
          SELECT d.name AS district, COUNT(f.id) AS total_fir,
                 COUNT(CASE WHEN f.status = 'closed' THEN 1 END) AS closed,
                 COUNT(c.id) AS total_cases
          FROM districts d
          LEFT JOIN fir f ON f.district_id = d.id
          LEFT JOIN cases c ON c.district_id = d.id
          GROUP BY d.name ORDER BY total_fir DESC
        `)
        reportData = { districts: result.rows }
        break
      }
      case 'criminal_report': {
        const result = await client.query(`
          SELECT cr.criminal_id, cr.full_name, cr.risk_level, cr.risk_score,
                 cr.is_wanted, cr.total_cases, cr.total_convictions
          FROM criminals cr
          WHERE cr.is_wanted = TRUE OR cr.risk_level IN ('high', 'critical')
          ORDER BY cr.risk_score DESC
        `)
        reportData = { criminals: result.rows }
        break
      }
      default: {
        return res.status(400).json({ success: false, error: 'Invalid report type' })
      }
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report.pdf"`)
      res.send(pdfBuffer)
    })

    doc.fontSize(20).text(docTitle, { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(10).fillColor('#666').text(
      `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      { align: 'center' }
    )
    doc.moveDown(1)
    doc.fillColor('#000').fontSize(12)

    if (type === 'crime_summary' && reportData.summary) {
      doc.fontSize(14).text('Crime Summary - Last 30 Days').moveDown(0.5)
      doc.fontSize(10)
      reportData.summary.forEach((row) => {
        doc.text(`${row.crime_category}: ${row.count} (${row.status})`)
      })
    } else if (type === 'district_report' && reportData.districts) {
      doc.fontSize(14).text('District-wise Crime Report').moveDown(0.5)
      doc.fontSize(10)
      reportData.districts.forEach((row) => {
        doc.text(`${row.district} - FIR: ${row.total_fir}, Closed: ${row.closed}, Cases: ${row.total_cases}`)
      })
    } else if (type === 'criminal_report' && reportData.criminals) {
      doc.fontSize(14).text('Wanted & High-Risk Criminals Report').moveDown(0.5)
      doc.fontSize(10)
      reportData.criminals.forEach((row) => {
        doc.text(`${row.criminal_id} | ${row.full_name} | Risk: ${row.risk_level} (${row.risk_score}) | Cases: ${row.total_cases}`)
      })
    }

    doc.end()
  } catch (error) {
    console.error('[REPORT] Error:', error)
    res.status(500).json({ success: false, error: 'Report generation failed' })
  } finally {
    client.release()
    await pool.end()
  }
}
