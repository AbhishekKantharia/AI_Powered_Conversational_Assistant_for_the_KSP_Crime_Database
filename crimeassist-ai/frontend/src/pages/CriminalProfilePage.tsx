import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { User, AlertTriangle, Shield, MapPin, Briefcase, FileText, ChevronLeft, Award } from 'lucide-react'

export default function CriminalProfilePage() {
  const { id } = useParams()

  const profile = {
    criminalId: 'KSP-CR-2026-0042',
    fullName: 'Vikram alias "Ghost"',
    aliases: ['Vikram Shetty', 'Vicky', 'Ghost Operator'],
    age: 34,
    gender: 'Male',
    nationality: 'Indian',
    riskLevel: 'Critical',
    riskScore: 92,
    isWanted: true,
    rewardAmount: '₹2,50,000',
    lastLocation: 'Hosur Road corridor, Bengaluru Urban',
    address: 'Flat 402, Royal Residency, BTM Layout 2nd Stage, Bengaluru',
    modusOperandi: 'Phishing via fake APK links followed by SIM swap and automated RTGS transfers.',
    specializations: ['Cyber Fraud', 'ATM Swiping', 'Identity Theft'],
    associatedCases: [
      { caseNumber: 'KSP-2026-0089', title: 'Cyber Fraud at MG Road Financial Hub', role: 'Prime Suspect' },
      { caseNumber: 'KSP-2026-0042', title: 'Phishing Syndicate Investigation', role: 'Accused' },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center space-x-3">
        <Link to="/criminals" className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{profile.criminalId}</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{profile.fullName}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Profile Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-rose-500 flex items-center justify-center font-bold text-3xl text-slate-400 mb-3 shadow-xl">
              V
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{profile.fullName}</h2>
            <p className="text-xs text-slate-400">Aliases: {profile.aliases.join(', ')}</p>

            <div className="mt-4 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold text-xs flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1.5" /> WANTED - REWARD {profile.rewardAmount}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Age / Gender:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{profile.age} Yrs / {profile.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">AI Risk Rating:</span>
              <span className="font-bold text-rose-500">{profile.riskScore}/100 ({profile.riskLevel})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Nationality:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{profile.nationality}</span>
            </div>
          </div>
        </div>

        {/* Right Details Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* Modus Operandi */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modus Operandi & Pattern Analysis</h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{profile.modusOperandi}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {profile.specializations.map((s, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-blue-500/10 text-blue-500 font-semibold text-xs rounded-lg">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Last Known Location */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-rose-500" /> Last Known Location
            </h3>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{profile.lastLocation}</p>
            <p className="text-[11px] text-slate-400">Registered Address: {profile.address}</p>
          </div>

          {/* Associated Cases */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Associated KSP Case Files</h3>
            <div className="space-y-3">
              {profile.associatedCases.map((c, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{c.caseNumber}</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{c.title}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 font-semibold rounded-full">{c.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
