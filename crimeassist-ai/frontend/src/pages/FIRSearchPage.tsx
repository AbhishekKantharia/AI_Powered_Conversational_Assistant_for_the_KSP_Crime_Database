import React, { useState } from 'react'
import {
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
} from 'lucide-react'
import Papa from 'papaparse'

export default function FIRSearchPage() {
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('all')
  const [crimeCategory, setCrimeCategory] = useState('all')
  const [status, setStatus] = useState('all')

  // Sample FIR dataset (1000 items structure mock)
  const firList = [
    {
      id: 'fir-1',
      firNumber: 'FIR/CSB/2026/00142',
      complainantName: 'Suresh Gowda',
      incidentDate: '2026-07-24',
      district: 'Bengaluru Urban',
      station: 'Central Silk Board PS',
      category: 'Cybercrime',
      status: 'filed',
      accusedKnown: false,
    },
    {
      id: 'fir-2',
      firNumber: 'FIR/MYS/2026/00098',
      complainantName: 'Ananya Rao',
      incidentDate: '2026-07-22',
      district: 'Mysuru',
      station: 'Devaraja PS',
      category: 'Theft',
      status: 'under_investigation',
      accusedKnown: true,
    },
    {
      id: 'fir-3',
      firNumber: 'FIR/HUB/2026/00215',
      complainantName: 'Keshava Murthy',
      incidentDate: '2026-07-20',
      district: 'Hubballi-Dharwad',
      station: 'Subhash Nagar PS',
      category: 'Robbery',
      status: 'chargesheeted',
      accusedKnown: true,
    },
    {
      id: 'fir-4',
      firNumber: 'FIR/MNG/2026/00054',
      complainantName: 'Mohammed Zayd',
      incidentDate: '2026-07-18',
      district: 'Mangaluru',
      station: 'Kadri PS',
      category: 'Fraud',
      status: 'disposed',
      accusedKnown: false,
    },
    {
      id: 'fir-5',
      firNumber: 'FIR/BLG/2026/00112',
      complainantName: 'Priya Patil',
      incidentDate: '2026-07-15',
      district: 'Belagavi',
      station: 'Camp Police Station',
      category: 'Burglary',
      status: 'closed',
      accusedKnown: true,
    },
  ]

  const filtered = firList.filter((f) => {
    const matchSearch =
      f.firNumber.toLowerCase().includes(search.toLowerCase()) ||
      f.complainantName.toLowerCase().includes(search.toLowerCase())
    const matchDistrict = district === 'all' || f.district === district
    const matchCategory = crimeCategory === 'all' || f.category === crimeCategory
    const matchStatus = status === 'all' || f.status === status
    return matchSearch && matchDistrict && matchCategory && matchStatus
  })

  const handleExportCSV = () => {
    const csv = Papa.unparse(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `KSP-FIR-Export-${Date.now()}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">FIR Search & Database</h1>
          <p className="text-xs text-slate-500">Karnataka State Police First Information Report Directory</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Search Results (CSV)</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by FIR Number, Complainant Name or Keyword..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              District
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Karnataka Districts</option>
              <option value="Bengaluru Urban">Bengaluru Urban</option>
              <option value="Mysuru">Mysuru</option>
              <option value="Hubballi-Dharwad">Hubballi-Dharwad</option>
              <option value="Mangaluru">Mangaluru</option>
              <option value="Belagavi">Belagavi</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Crime Category
            </label>
            <select
              value={crimeCategory}
              onChange={(e) => setCrimeCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Crime Categories</option>
              <option value="Cybercrime">Cybercrime</option>
              <option value="Robbery">Robbery</option>
              <option value="Burglary">Burglary</option>
              <option value="Theft">Theft</option>
              <option value="Fraud">Fraud</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              FIR Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="filed">Filed</option>
              <option value="under_investigation">Under Investigation</option>
              <option value="chargesheeted">Chargesheeted</option>
              <option value="disposed">Disposed</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">FIR Number</th>
                <th className="p-4">Complainant</th>
                <th className="p-4">Incident Date</th>
                <th className="p-4">District & Station</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{item.firNumber}</td>
                  <td className="p-4 font-medium text-slate-900 dark:text-white">{item.complainantName}</td>
                  <td className="p-4 text-slate-500">{item.incidentDate}</td>
                  <td className="p-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{item.district}</p>
                    <p className="text-[10px] text-slate-400">{item.station}</p>
                  </td>
                  <td className="p-4 font-medium">{item.category}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 uppercase">
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filtered.length} of {firList.length} FIR records</span>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-900 dark:text-white px-2">1</span>
            <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
