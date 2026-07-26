import { useState } from 'react'
import { Download, Share2, Plus, FileText, Clock, CheckCircle2 } from 'lucide-react'
import { useReports, useGenerateReport } from '../hooks/useAPI'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('crime_summary')
  const [reportTitle, setReportTitle] = useState('')

  const { data: reports, isLoading } = useReports()
  const generateReport = useGenerateReport()

  const handleGenerate = async () => {
    const title = reportTitle || `${reportType.replace(/_/g, ' ')} - ${new Date().toLocaleDateString('en-IN')}`

    try {
      await generateReport.mutateAsync({ type: reportType, title })
      toast.success('Report generated successfully!')
      setReportTitle('')
    } catch {
      toast.error('Failed to generate report. Please try again.')
    }
  }

  const reportList = (reports as unknown as Record<string, unknown>[]) ?? []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Official KSP Report Generator</h1>
          <p className="text-xs text-slate-500">Automated Intelligence & Audit Dossier Compilation</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Generate Custom Report</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            >
              <option value="crime_summary">Crime Summary Report</option>
              <option value="district_report">District-wise Report</option>
              <option value="criminal_report">Criminal Intelligence Report</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Custom Title (Optional)</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Enter report title..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generateReport.isPending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {generateReport.isPending ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{generateReport.isPending ? 'Generating...' : 'Generate Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Reports Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Archived Reports Directory</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
              </div>
            ))
          ) : reportList.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No reports generated yet. Create your first report above.
            </div>
          ) : (
            reportList.map((r, idx) => (
              <div key={(r.id as string) || idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{(r.title as string) || 'Untitled Report'}</p>
                    <p className="text-[10px] text-slate-400">
                      Type: {(r.report_type as string)?.replace(/_/g, ' ')} &bull; Created {formatDate(r.created_at as string)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
                  </span>
                  <button className="p-2 text-blue-600 hover:bg-blue-500/10 rounded-lg">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
