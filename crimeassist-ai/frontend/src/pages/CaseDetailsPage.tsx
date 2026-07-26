import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Briefcase,
  User,
  Shield,
  FileText,
  Clock,
  Plus,
  Bot,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  Share2,
} from 'lucide-react'

export default function CaseDetailsPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState<'summary' | 'evidence' | 'timeline' | 'notes'>('summary')

  const caseData = {
    caseNumber: 'KSP-2026-0089',
    title: 'Cyber Fraud at MG Road Financial Hub',
    category: 'Cybercrime',
    status: 'Under Investigation',
    priority: 'High',
    district: 'Bengaluru Urban',
    station: 'Central Silk Board PS',
    officer: 'Inspector Rajesh Kumar (KSP-8821)',
    registeredDate: '24 July 2026',
    aiRiskScore: 82,
    ipcSections: ['IPC 420', 'IPC 468', 'IT Act 66D'],
    aiSummary:
      'Investigation launched following multi-victim phishing & unauthorized bank transfers totaling ₹45 Lakhs. Suspect IP origins traced to interstate proxy servers. Evidence includes CCTV footage from ATM kiosks and bank transfer logs.',
  }

  const timeline = [
    { date: '24 Jul 2026', title: 'FIR Filed & Case Registered', desc: 'Complainant reported unauthorized debit of ₹15 Lakhs.' },
    { date: '25 Jul 2026', title: 'Bank Account Freeze Issued', desc: 'Notice under Section 91 CrPC dispatched to Nodal Officer.' },
    { date: '26 Jul 2026', title: 'AI Evidence Correlation', desc: 'CrimeAssist AI detected matching suspect pattern with Case #KSP-2026-0042.' },
  ]

  const suspects = [
    { name: 'Vikram alias "Ghost"', status: 'Prime Suspect / Absconding', risk: 'High' },
  ]

  const evidenceList = [
    { name: 'ATM_CCTV_Footage_0724.mp4', type: 'Video/CCTV', size: '240 MB', status: 'Under Analysis' },
    { name: 'Bank_Statement_Log.pdf', type: 'Documentary', size: '1.2 MB', status: 'Submitted' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/cases" className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{caseData.caseNumber}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500">{caseData.status}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{caseData.title}</h1>
          </div>
        </div>

        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all">
          <Share2 className="w-4 h-4" />
          <span>Export Case File (PDF)</span>
        </button>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs header */}
          <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            {(['summary', 'evidence', 'timeline', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* AI Summary Box */}
              <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-blue-900/10 p-5 rounded-2xl border border-blue-500/20 space-y-3">
                <div className="flex items-center space-x-2 text-blue-500 font-bold text-xs uppercase tracking-wider">
                  <Bot className="w-4 h-4" />
                  <span>AI Executive Summary (CrimeAssist RAG Engine)</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{caseData.aiSummary}</p>
              </div>

              {/* Suspects & Victims */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Suspects & Persons of Interest</h3>
                <div className="space-y-3">
                  {suspects.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                        <p className="text-[10px] text-slate-400">{s.status}</p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-500 rounded-full">{s.risk} Risk</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Chain of Custody & Evidence Logs</h3>
              <div className="space-y-3">
                {evidenceList.map((e, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{e.name}</p>
                      <p className="text-[10px] text-slate-400">{e.type} • {e.size}</p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-500 rounded-full">{e.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Investigation Timeline</h3>
              <div className="border-l-2 border-blue-500/30 ml-3 space-y-6 pl-6">
                {timeline.map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                    <span className="text-[10px] font-mono text-blue-500 font-bold">{item.date}</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Officer Case Notes</h3>
              <textarea
                placeholder="Add Confidential Case Note..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                rows={3}
              />
              <button className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl">Save Note</button>
            </div>
          )}
        </div>

        {/* Right Col: Officer & Case Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Officers</h3>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                RK
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{caseData.officer}</p>
                <p className="text-[10px] text-slate-400">Investigation Lead</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Legal Sections</h3>
            <div className="flex flex-wrap gap-2">
              {caseData.ipcSections.map((sec, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold rounded-lg">
                  {sec}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
