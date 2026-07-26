import { useParams, Link } from 'react-router-dom'
import { AlertTriangle, MapPin, ChevronLeft } from 'lucide-react'
import { useCriminalDetail } from '../hooks/useAPI'
import { getRiskBadgeClass, formatCurrency } from '../lib/utils'

export default function CriminalProfilePage() {
  const { id } = useParams()
  const { data: criminal, isLoading } = useCriminalDetail(id)

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="lg:col-span-2 h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!criminal) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-sm">Criminal profile not found.</p>
        <Link to="/criminals" className="text-blue-500 text-xs font-bold mt-2 inline-block">Back to Criminals</Link>
      </div>
    )
  }

  const c = criminal as Record<string, unknown>
  const aliases = (c.aliases as string[]) ?? []
  const specs = (c.crime_specialization as string[]) ?? []
  const cases = (c.cases as Record<string, unknown>[]) ?? []

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center space-x-3">
        <Link to="/criminals" className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{c.criminal_id as string}</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{c.full_name as string}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Profile Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-slate-600 flex items-center justify-center font-bold text-3xl text-slate-400 mb-3 shadow-xl">
              {(c.full_name as string)?.charAt(0)}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{c.full_name as string}</h2>
            {aliases.length > 0 && (
              <p className="text-xs text-slate-400">Aliases: {aliases.join(', ')}</p>
            )}

            {(c.is_wanted as boolean) && (
              <div className="mt-4 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold text-xs flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1.5" /> WANTED
                {c.reward_amount && <span className="ml-1">&bull; {formatCurrency(c.reward_amount as number)}</span>}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Age / Gender:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{(c.age as number) ?? 'N/A'} / {c.gender as string}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Risk Rating:</span>
              <span className={`font-bold capitalize ${getRiskBadgeClass(c.risk_level as string)}`}>
                {c.risk_level as string} ({c.risk_score as number}/100)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Nationality:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{c.nationality as string}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Cases:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{c.total_cases as number ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Convictions:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{c.total_convictions as number ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {c.is_arrested ? 'Arrested' : c.is_absconding ? 'Absconding' : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Details Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* Modus Operandi */}
          {c.modus_operandi && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modus Operandi & Pattern Analysis</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{c.modus_operandi as string}</p>
              {specs.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {specs.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-blue-500/10 text-blue-500 font-semibold text-xs rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Last Known Location */}
          {(c.last_known_location || c.address) && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-rose-500" /> Last Known Location
              </h3>
              {c.last_known_location && (
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{c.last_known_location as string}</p>
              )}
              {c.address && (
                <p className="text-[11px] text-slate-400">Address: {c.address as string}</p>
              )}
            </div>
          )}

          {/* Associated Cases */}
          {cases.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Associated KSP Case Files</h3>
              <div className="space-y-3">
                {cases.map((caseItem, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{caseItem.case_number as string}</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{caseItem.title as string}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{(caseItem.crime_category as string)?.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 font-semibold rounded-full">{caseItem.role_in_crime as string ?? 'Suspect'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Profile Summary */}
          {c.ai_profile_summary && (
            <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-blue-900/10 p-5 rounded-2xl border border-blue-500/20 space-y-3">
              <div className="flex items-center space-x-2 text-blue-500 font-bold text-xs uppercase tracking-wider">
                <span>AI Profile Summary</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{c.ai_profile_summary as string}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
