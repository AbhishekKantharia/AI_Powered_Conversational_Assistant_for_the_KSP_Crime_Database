import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Plus, Search, Filter, Eye, ArrowUpRight, ShieldAlert } from 'lucide-react'

export default function CasesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const cases = [
    {
      id: 'c-101',
      caseNumber: 'KSP-2026-0089',
      title: 'Cyber Fraud at MG Road Financial Hub',
      category: 'Cybercrime',
      status: 'under_investigation',
      priority: 5,
      officer: 'Inspector R. Kumar',
      registeredDate: '2026-07-24',
      riskScore: 82,
    },
    {
      id: 'c-102',
      caseNumber: 'KSP-2026-0088',
      title: 'Armed Robbery near Silk Board Flyover',
      category: 'Robbery',
      status: 'charge_sheet_filed',
      priority: 4,
      officer: 'Sub-Inspector M. Swamy',
      registeredDate: '2026-07-22',
      riskScore: 91,
    },
    {
      id: 'c-103',
      caseNumber: 'KSP-2026-0087',
      title: 'Commercial Property Burglary - Indiranagar',
      category: 'Burglary',
      status: 'registered',
      priority: 3,
      officer: 'Inspector V. Hegde',
      registeredDate: '2026-07-21',
      riskScore: 65,
    },
    {
      id: 'c-104',
      caseNumber: 'KSP-2026-0086',
      title: 'Vehicle Theft Syndicate Operation',
      category: 'Theft',
      status: 'closed',
      priority: 2,
      officer: 'Inspector R. Kumar',
      registeredDate: '2026-07-19',
      riskScore: 40,
    },
  ]

  const filtered = cases.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case title or case number..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
        >
          <option value="all">All Case Statuses</option>
          <option value="registered">Registered</option>
          <option value="under_investigation">Under Investigation</option>
          <option value="charge_sheet_filed">Charge Sheet Filed</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">{c.caseNumber}</span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{c.title}</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 uppercase">
                {c.status.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Category: <strong>{c.category}</strong></span>
              <span>Officer: <strong>{c.officer}</strong></span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  AI Risk Score: <span className="text-rose-500">{c.riskScore}/100</span>
                </span>
              </div>
              <Link
                to={`/cases/${c.id}`}
                className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center space-x-1"
              >
                <span>View Details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
