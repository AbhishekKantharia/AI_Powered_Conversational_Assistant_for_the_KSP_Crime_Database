import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, AlertTriangle, Plus, Eye } from 'lucide-react'
import { useCriminalList } from '../hooks/useAPI'
import { getRiskBadgeClass, formatCurrency } from '../lib/utils'

export default function CriminalListPage() {
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [page, setPage] = useState(1)

  const filters = useMemo(() => ({
    ...(search && { search }),
    ...(riskFilter && { riskLevel: riskFilter }),
    page,
    limit: 12,
  }), [search, riskFilter, page])

  const { data, isLoading } = useCriminalList(filters)

  const criminals = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Criminal Records & Wanted Database</h1>
          <p className="text-xs text-slate-500">KSP State Criminal Intelligence Register</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all">
          <Plus className="w-4 h-4" />
          <span>Add Criminal Record</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search criminal name, alias or KSP criminal ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={riskFilter}
          onChange={(e) => { setRiskFilter(e.target.value); setPage(1) }}
          className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
        >
          <option value="">All Risk Levels</option>
          <option value="critical">Critical Risk</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse">
              <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : criminals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-slate-500 text-sm">No criminal records found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {criminals.map((cr: Record<string, unknown>) => {
            const riskLevel = cr.risk_level as string
            const isWanted = cr.is_wanted as boolean
            const aliases = (cr.aliases as string[]) ?? []
            const specs = (cr.crime_specialization as string[]) ?? []

            return (
              <div
                key={cr.id as string}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                <div className="p-5 space-y-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-lg">
                      {(cr.full_name as string)?.charAt(0)}
                    </div>
                    {isWanted && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 uppercase tracking-wider flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" /> WANTED
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">{cr.criminal_id as string}</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{cr.full_name as string}</h3>
                    <p className="text-[11px] text-slate-500">
                      Age: {cr.age as number ?? 'N/A'} &bull; Cases: {cr.total_cases as number ?? 0}
                    </p>
                    {cr.reward_amount && (
                      <p className="text-[11px] text-amber-600 font-semibold">Reward: {formatCurrency(cr.reward_amount as number)}</p>
                    )}
                  </div>

                  {specs.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modus Operandi</p>
                      <div className="flex flex-wrap gap-1">
                        {specs.slice(0, 3).map((spec: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] rounded">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className={`text-xs font-bold capitalize ${getRiskBadgeClass(riskLevel)}`}>
                    Risk: {riskLevel} ({cr.risk_score as number}/100)
                  </span>
                  <Link
                    to={`/criminals/${cr.id as string}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center space-x-1"
                  >
                    <span>Profile</span>
                    <Eye className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {total > 12 && (
        <div className="flex justify-center items-center space-x-3 text-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="font-semibold text-slate-900 dark:text-white">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={criminals.length < 12}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
