import React, { useState } from 'react'
import { FileSpreadsheet, Download, Share2, Plus, CheckCircle2 } from 'lucide-react'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('monthly_summary')

  const reports = [
    { title: 'Karnataka Monthly Crime Audit - July 2026', type: 'Monthly Summary', date: '2026-07-25', status: 'Ready', size: '4.2 MB' },
    { title: 'Bengaluru Urban Cybercrime Intelligence Report', type: 'Specialized', date: '2026-07-20', status: 'Ready', size: '2.8 MB' },
    { title: 'Statewide Wanted Criminal Profile Dossier', type: 'Dossier', date: '2026-07-15', status: 'Ready', size: '8.5 MB' },
  ]

  const handleGenerate = () => {
    alert('Report generation initiated. The compiled PDF will download automatically when completed.')
  }

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
              <option value="monthly_summary">Monthly Crime Summary</option>
              <option value="district_analysis">District Comparison Audit</option>
              <option value="wanted_dossier">Wanted Criminals List</option>
              <option value="cybercrime_special">Cybercrime Special Investigation</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Format</label>
            <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white">
              <option>PDF Document</option>
              <option>Excel Spreadsheet</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Report</span>
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
          {reports.map((r, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{r.title}</p>
                <p className="text-[10px] text-slate-400">{r.type} • Created {r.date} • {r.size}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-blue-600 hover:bg-blue-500/10 rounded-lg">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
