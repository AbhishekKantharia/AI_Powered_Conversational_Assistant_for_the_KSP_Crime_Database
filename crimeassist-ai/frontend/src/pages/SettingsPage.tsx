import React, { useState } from 'react'
import { User, Shield, Key, FileText, Bell, Moon, Lock } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { darkMode, toggleDarkMode } = useUIStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'audit'>('profile')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">System Settings & User Profile</h1>
        <p className="text-xs text-slate-500">Configure officer credentials, security settings, and audit logs</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {(['profile', 'security', 'audit'] as const).map((tab) => (
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

      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 max-w-2xl">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
              {user?.fullName?.charAt(0) || 'O'}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{user?.fullName}</h2>
              <p className="text-xs text-slate-400">Badge: {user?.badgeNumber || 'KSP-8821'} • {user?.rank || 'Senior Inspector'}</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
              <input type="email" value={user?.email || 'officer@ksp.gov.in'} readOnly className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Station Jurisdiction</label>
              <input type="text" value={user?.stationName || 'Central Silk Board Police Station'} readOnly className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 max-w-2xl text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Security & Authentication</h2>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Dark Mode Interface</p>
              <p className="text-[10px] text-slate-400">Toggle dark theme dashboard styling</p>
            </div>
            <button onClick={toggleDarkMode} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold">
              {darkMode ? 'Disable Dark' : 'Enable Dark'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">System Audit Trail Logs</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-2">
            <div className="flex justify-between py-2">
              <span>[2026-07-26 18:10] LOGIN_SUCCESS by KSP-8821</span>
              <span className="text-emerald-500 font-bold">SUCCESS</span>
            </div>
            <div className="flex justify-between py-2">
              <span>[2026-07-26 18:12] AI_CHAT_QUERY: "Phishing section"</span>
              <span className="text-emerald-500 font-bold">SUCCESS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
