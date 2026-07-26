import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react'
import { useFIRList } from '../hooks/useAPI'
import { downloadCSV, getStatusColor, formatDate } from '../lib/utils'
import type { FIR } from '../types'

export default function FIRSearchPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('')
  const [crimeCategory, setCrimeCategory] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const filters = useMemo(() => ({
    ...(search && { search }),
    ...(district && { districtId: district }),
    ...(crimeCategory && { crimeCategory }),
    ...(status && { status }),
    page,
    limit,
  }), [search, district, crimeCategory, status, page])

  const { data, isLoading } = useFIRList(filters)

  const firList = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const handleExportCSV = () => {
    if (!firList.length) return
    const exportData = firList.map((f: FIR) => ({
      'FIR Number': f.firNumber,
      'Complainant': f.complainantName,
      'Date': f.incidentDate,
      'Category': f.crimeCategory,
      'Status': f.status,
    }))
    downloadCSV(exportData, `KSP-FIR-Export-${Date.now()}.csv`)
  }

  return (
    <div className="space-y-6">
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
          <span>Export Results (CSV)</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by FIR Number, Complainant Name or Keyword..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Crime Category</label>
            <select
              value={crimeCategory}
              onChange={(e) => { setCrimeCategory(e.target.value); setPage(1) }}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            >
              <option value="">All Categories</option>
              <option value="murder">Murder</option>
              <option value="robbery">Robbery</option>
              <option value="burglary">Burglary</option>
              <option value="theft">Theft</option>
              <option value="fraud">Fraud</option>
              <option value="cybercrime">Cybercrime</option>
              <option value="assault">Assault</option>
              <option value="kidnapping">Kidnapping</option>
              <option value="drug_offense">Drug Offense</option>
              <option value="property_crime">Property Crime</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="filed">Filed</option>
              <option value="under_investigation">Under Investigation</option>
              <option value="chargesheeted">Chargesheeted</option>
              <option value="disposed">Disposed</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
            <input
              type="date"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="ksp-table w-full text-xs text-left">
            <thead>
              <tr>
                <th className="p-4">FIR Number</th>
                <th className="p-4">Complainant</th>
                <th className="p-4">Incident Date</th>
                <th className="p-4">District</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-4">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : firList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    No FIR records found matching your criteria.
                  </td>
                </tr>
              ) : (
                firList.map((item: FIR) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {item.firNumber}
                    </td>
                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                      {item.complainantName}
                    </td>
                    <td className="p-4 text-slate-500">
                      {formatDate(item.incidentDate)}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {item.districtName ?? 'N/A'}
                    </td>
                    <td className="p-4 capitalize">
                      {item.crimeCategory?.replace(/_/g, ' ')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(item.status)}`}>
                        {item.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/fir`)}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} of {total.toLocaleString()} FIR records</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-900 dark:text-white px-2">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
