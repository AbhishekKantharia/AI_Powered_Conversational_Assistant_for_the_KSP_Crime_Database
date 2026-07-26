import { Link } from 'react-router-dom'
import {
  FileText,
  Briefcase,
  CheckCircle,
  AlertTriangle,
  Bot,
  ArrowUpRight,
  TrendingUp,
  Shield,
  Plus,
  Users,
  Search,
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { useDashboardData } from '../hooks/useAPI'
import { getStatusColor, formatDate } from '../lib/utils'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useDashboardData()

  const stats = dashboard?.stats
  const statCards = [
    {
      title: 'Total FIR (YTD)',
      value: stats?.totalFirThisYear?.toLocaleString() ?? '--',
      icon: FileText,
      color: 'blue',
    },
    {
      title: 'Open Cases',
      value: stats?.openCases?.toLocaleString() ?? '--',
      icon: Briefcase,
      color: 'amber',
    },
    {
      title: 'Closed Cases',
      value: stats?.closedCases?.toLocaleString() ?? '--',
      icon: CheckCircle,
      color: 'emerald',
    },
    {
      title: 'Wanted Criminals',
      value: stats?.wantedCriminals?.toLocaleString() ?? '--',
      icon: AlertTriangle,
      color: 'rose',
    },
  ]

  const lineChartData = {
    labels: dashboard?.monthlyTrend?.map((m) => m.month) ?? [],
    datasets: [
      {
        label: 'FIR Registered',
        data: dashboard?.monthlyTrend?.map((m) => m.total) ?? [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Resolved',
        data: dashboard?.monthlyTrend?.map((m) => m.resolved) ?? [],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const barChartData = {
    labels: dashboard?.topDistricts?.map((d) => d.district) ?? [],
    datasets: [
      {
        label: 'Crime Count',
        data: dashboard?.topDistricts?.map((d) => d.crimeCount) ?? [],
        backgroundColor: '#1d4ed8',
        borderRadius: 8,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(148, 163, 184, 0.1)' } },
    },
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Karnataka State Police Intelligence Dashboard</h1>
          <p className="text-xs text-blue-200 mt-1">Real-time crime tracking, RAG-powered AI investigation assistant & analytics.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/ai-chat"
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
          >
            <Bot className="w-4 h-4" />
            <span>Launch AI Assistant</span>
          </Link>
          <Link
            to="/fir"
            className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register FIR</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.title}</span>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isLoading ? (
                  <span className="inline-block w-16 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ) : stat.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Crime Registration Trend</h2>
              <p className="text-xs text-slate-500">Monthly FIR filing & resolution across Karnataka</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="h-64">
            {isLoading ? (
              <div className="h-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ) : (
              <Line data={lineChartData} options={chartOptions} />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">District-wise Crime</h2>
              <p className="text-xs text-slate-500">Top high-density jurisdictions</p>
            </div>
            <Shield className="w-4 h-4 text-blue-500" />
          </div>
          <div className="h-64">
            {isLoading ? (
              <div className="h-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ) : (
              <Bar data={barChartData} options={chartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Recent Cases & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Active Investigations</h2>
            <Link to="/cases" className="text-xs font-semibold text-blue-600 hover:text-blue-500 flex items-center">
              View All Cases <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="p-3">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : (
                  dashboard?.recentCases?.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{c.caseNumber}</td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{c.title}</td>
                      <td className="p-3">{c.crimeCategory}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusColor(c.status)}`}>
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Officer Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            <Link
              to="/ai-chat"
              className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors flex items-center space-x-3"
            >
              <Bot className="w-6 h-6 text-blue-500" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Ask AI Investigation Assistant</p>
                <p className="text-[10px] text-slate-500">Query RAG knowledge base & IPC codes</p>
              </div>
            </Link>

            <Link
              to="/criminals"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center space-x-3"
            >
              <Users className="w-6 h-6 text-amber-500" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Criminal Profile Lookup</p>
                <p className="text-[10px] text-slate-500">Check risk scores & wanted database</p>
              </div>
            </Link>

            <Link
              to="/fir"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center space-x-3"
            >
              <Search className="w-6 h-6 text-emerald-500" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">FIR Search & Export</p>
                <p className="text-[10px] text-slate-500">Search FIR by district or category</p>
              </div>
            </Link>
          </div>

          {/* Crime Category Distribution */}
          <div className="mt-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Crime Category Breakdown</h3>
            <div className="space-y-2">
              {dashboard?.crimeByCategory?.slice(0, 5).map((cat, idx) => {
                const maxCount = dashboard.crimeByCategory[0]?.count || 1
                const pct = Math.round((cat.count / maxCount) * 100)
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="font-medium text-slate-600 dark:text-slate-400 capitalize">{cat.crime_category.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{cat.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
