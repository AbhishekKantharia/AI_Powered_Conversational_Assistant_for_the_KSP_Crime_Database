import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Bot,
  FileText,
  Briefcase,
  Users,
  BarChart3,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
} from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user, logout } = useAuthStore()

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'AI Assistant', icon: Bot, path: '/ai-chat', badge: 'GPT-4' },
    { label: 'FIR Search', icon: FileText, path: '/fir' },
    { label: 'Cases', icon: Briefcase, path: '/cases' },
    { label: 'Criminals', icon: Users, path: '/criminals' },
    { label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { label: 'Reports', icon: FileSpreadsheet, path: '/reports' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ]

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-600/30 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-bold text-white tracking-wide text-base leading-tight">CrimeAssist</span>
              <span className="text-[10px] font-semibold tracking-wider text-blue-400 uppercase">Karnataka Police</span>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && (
              <span className="ml-3 text-sm font-medium tracking-wide flex-1 whitespace-nowrap">{item.label}</span>
            )}
            {!sidebarCollapsed && item.badge && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {item.badge}
              </span>
            )}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-slate-700">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile / Logout footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-white truncate">{user?.fullName || 'Police Officer'}</span>
                <span className="text-[10px] text-slate-400 truncate capitalize">{user?.role?.replace('_', ' ') || 'Officer'}</span>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
