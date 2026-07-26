import { useState } from 'react'
import { Moon } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { useAuditLogs } from '../hooks/useAPI'
import { formatDateTime } from '../lib/utils'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { darkMode, toggleDarkMode } = useUIStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'audit'>('profile')

  const { data: auditLogs, isLoading: loadingAudit } = useAuditLogs(activeTab === 'audit' ? { limit: 50 } : undefined)

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
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{user?.fullName || 'Officer'}</h2>
              <p className="text-xs text-slate-400">Badge: {user?.badgeNumber || 'N/A'} &bull; Role: {user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
              <input type="email" value={user?.email || ''} readOnly className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Station Jurisdiction</label>
              <input type="text" value={user?.stationName || 'N/A'} readOnly className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">District</label>
              <input type="text" value={user?.districtName || 'N/A'} readOnly className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white" />
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
            <button onClick={toggleDarkMode} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold flex items-center space-x-1">
              <Moon className="w-3.5 h-3.5" />
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <p className="font-bold text-slate-900 dark:text-white mb-1">Two-Factor Authentication</p>
            <p className="text-[10px] text-slate-400 mb-2">
              Status: {user?.twoFactorEnabled ? (
                <span className="text-emerald-500 font-bold">Enabled</span>
              ) : (
                <span className="text-amber-500 font-bold">Disabled</span>
              )}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">System Audit Trail Logs</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {loadingAudit ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                </div>
              ))
            ) : !auditLogs || (auditLogs as unknown[]).length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No audit logs found.
              </div>
            ) : (
              (auditLogs as Record<string, unknown>[]).map((log, idx) => (
                <div key={(log.id as string) || idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div>
                    <span className="text-slate-500">[{formatDateTime(log.created_at as string)}]</span>{' '}
                    <span className="font-bold text-slate-900 dark:text-white">{log.action as string}</span>
                    <span className="text-slate-500 ml-1">by {(log.user_id as string)?.slice(0, 8)}</span>
                  </div>
                  <span className={`font-bold ${log.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {(log.status as string)?.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
