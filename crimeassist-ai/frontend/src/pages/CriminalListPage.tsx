import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Search, AlertTriangle, Shield, ArrowUpRight, Plus, Eye } from 'lucide-react'

export default function CriminalListPage() {
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')

  const criminals = [
    {
      id: 'cr-101',
      criminalId: 'KSP-CR-2026-0042',
      name: 'Vikram alias "Ghost"',
      age: 34,
      riskLevel: 'critical',
      riskScore: 92,
      isWanted: true,
      reward: '₹2,50,000',
      totalCases: 14,
      specialization: ['Cyber Fraud', 'ATM Swiping', 'Identity Theft'],
      lastLocation: 'Hosur Road, Bengaluru',
    },
    {
      id: 'cr-102',
      criminalId: 'KSP-CR-2025-0812',
      name: 'Ramesh "Blade" Gowda',
      age: 29,
      riskLevel: 'high',
      riskScore: 78,
      isWanted: true,
      reward: '₹1,00,000',
      totalCases: 8,
      specialization: ['Armed Robbery', 'Extortion'],
      lastLocation: 'Mysuru Suburbs',
    },
    {
      id: 'cr-103',
      criminalId: 'KSP-CR-2024-0551',
      name: 'Imran Khan',
      age: 41,
      riskLevel: 'medium',
      riskScore: 54,
      isWanted: false,
      reward: undefined,
      totalCases: 4,
      specialization: ['Commercial Burglary'],
      lastLocation: 'Hubballi Outer Ring Road',
    },
  ]

  const filtered = criminals.filter((cr) => {
    const matchSearch =
      cr.name.toLowerCase().includes(search.toLowerCase()) ||
      cr.criminalId.toLowerCase().includes(search.toLowerCase())
    const matchRisk = riskFilter === 'all' || cr.riskLevel === riskFilter
    return matchSearch && matchRisk
  })

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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search criminal name, alias or KSP criminal ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
        >
          <option value="all">All Risk Levels</option>
          <option value="critical">Critical Risk</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((cr) => (
          <div
            key={cr.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
          >
            <div className="p-5 space-y-4 flex-1">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-lg">
                  {cr.name.charAt(0)}
                </div>
                {cr.isWanted && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 uppercase tracking-wider flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" /> WANTED
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">{cr.criminalId}</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{cr.name}</h3>
                <p className="text-[11px] text-slate-500">Age: {cr.age} • Total Cases: {cr.totalCases}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modus Operandi</p>
                <div className="flex flex-wrap gap-1">
                  {cr.specialization.map((spec, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] rounded">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Risk Score: <span className="text-rose-500">{cr.riskScore}/100</span>
              </span>
              <Link
                to={`/criminals/${cr.id}`}
                className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center space-x-1"
              >
                <span>Full Profile</span>
                <Eye className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
