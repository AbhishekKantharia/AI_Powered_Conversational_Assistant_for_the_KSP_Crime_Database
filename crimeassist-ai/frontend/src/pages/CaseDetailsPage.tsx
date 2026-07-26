import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Bot,
  ChevronLeft,
  Share2,
  ShieldAlert,
} from 'lucide-react'
import { useCaseDetail, useAddCaseNote } from '../hooks/useAPI'
import { getStatusColor } from '../lib/utils'
import toast from 'react-hot-toast'
import type { Suspect, Evidence, CaseNote } from '../types'

export default function CaseDetailsPage() {
  const { id } = useParams()
  const { data: caseData, isLoading } = useCaseDetail(id)
  const addNote = useAddCaseNote()
  const [activeTab, setActiveTab] = useState<'summary' | 'evidence' | 'timeline' | 'notes'>('summary')
  const [noteText, setNoteText] = useState('')

  const handleSaveNote = async () => {
    if (!noteText.trim() || !id) return
    try {
      await addNote.mutateAsync({ caseId: id, content: noteText, noteType: 'general' })
      setNoteText('')
      toast.success('Note saved successfully')
    } catch {
      toast.error('Failed to save note')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  const c = caseData
  const ipcSections = c?.ipcSections ?? []
  const suspects: Suspect[] = c?.suspects ?? []
  const evidence: Evidence[] = c?.evidence ?? []
  const notes: CaseNote[] = c?.notes ?? []

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
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{c?.caseNumber}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(c?.status ?? '')}`}>
                {c?.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{c?.title}</h1>
          </div>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all">
          <Share2 className="w-4 h-4" />
          <span>Export Case (PDF)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details & Tabs */}
        <div className="lg:col-span-2 space-y-6">
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

          {activeTab === 'summary' && (
            <div className="space-y-6">
              {c?.aiSummary && (
                <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-blue-900/10 p-5 rounded-2xl border border-blue-500/20 space-y-3">
                  <div className="flex items-center space-x-2 text-blue-500 font-bold text-xs uppercase tracking-wider">
                    <Bot className="w-4 h-4" />
                    <span>AI Executive Summary</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{String(c.aiSummary)}</p>
                </div>
              )}

              {suspects.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Suspects</h3>
                  <div className="space-y-3">
                    {suspects.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{s.fullName}</span>
                          <p className="text-[10px] text-slate-400">{s.roleInCrime ?? 'Unknown role'}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${s.isArrested ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {s.isArrested ? 'Arrested' : 'At Large'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Evidence & Chain of Custody</h3>
              {evidence.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No evidence records found.</p>
              ) : (
                <div className="space-y-3">
                  {evidence.map((e, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{e.title}</p>
                        <p className="text-[10px] text-slate-400">{e.type} &bull; {e.evidenceNumber}</p>
                      </div>
                      <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-500 rounded-full">
                        {e.isForensicAnalyzed ? 'Analyzed' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Investigation Timeline</h3>
              {notes.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No timeline events found.</p>
              ) : (
                <div className="border-l-2 border-blue-500/30 ml-3 space-y-6 pl-6">
                  {notes.map((n, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                      <span className="text-[10px] font-mono text-blue-500 font-bold">
                        {new Date(n.createdAt).toLocaleDateString('en-IN')}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{n.noteType?.toUpperCase()}</h4>
                      <p className="text-xs text-slate-500 mt-1">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Officer Case Notes</h3>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add Confidential Case Note..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                rows={4}
              />
              <button
                onClick={handleSaveNote}
                disabled={!noteText.trim() || addNote.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl disabled:opacity-50"
              >
                {addNote.isPending ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {c?.assignedOfficerName && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Officer</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                  {c.assignedOfficerName?.charAt(0) || 'O'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{c.assignedOfficerName}</p>
                  <p className="text-[10px] text-slate-400">Badge: {c.officerBadge ?? 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {ipcSections.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Legal Sections</h3>
              <div className="flex flex-wrap gap-2">
                {ipcSections.map((sec, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold rounded-lg">
                    {sec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {c?.aiRiskScore ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Risk Assessment</h3>
              <div className="flex items-center space-x-3">
                <ShieldAlert className="w-8 h-8 text-rose-500" />
                <div>
                  <p className="text-2xl font-extrabold text-rose-500">{c.aiRiskScore}/100</p>
                  <p className="text-[10px] text-slate-400">CrimeAssist Risk Score</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
