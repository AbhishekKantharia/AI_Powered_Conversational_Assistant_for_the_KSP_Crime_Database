import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ArrowUpRight, ShieldAlert } from 'lucide-react'
import { useCaseList } from '../hooks/useAPI'
import { getStatusColor } from '../lib/utils'
import type { Case } from '../types'

export default function CasesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const filters = useMemo(() => ({
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
    page,
    limit: 20,
  }), [search, statusFilter, page])

  const { data, isLoading } = useCaseList(filters)
  const cases = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Active Case Management</h1>
          <p className="text-xs text-slate-500">Karnataka State Police Criminal Investigations</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all">
          <Plus className="w-4 h-4" />
          <span>New Case File</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by case title or case number..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="registered">Registered</option>
          <option value="under_investigation">Under Investigation</option>
          <option value="charge_sheet_filed">Charge Sheet Filed</option>
          <option value="court_proceedings">Court Proceedings</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-slate-500 text-sm">No cases found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cases.map((c: Record<string, unknown>) => (
            <div
              key={c.id as string}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">{c.case_number as string}</span>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{c.title as string}</h2>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(c.status as string)}`}>
                  {(c.status as string)?.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Category: <strong className="capitalize">{(c.crime_category as string)?.replace(/_/g, ' ')}</strong></span>
                <span>Priority: <strong>{c.priority as number}</strong></span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    AI Risk Score: <span className="text-rose-500">{c.ai_risk_score as number ?? 0}/100</span>
                  </span>
                </div>
                <Link
                  to={`/cases/${c.id as string}`}
                  className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center space-x-1"
                >
                  <span>View Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center items-center space-x-3 text-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="font-semibold text-slate-900 dark:text-white">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
