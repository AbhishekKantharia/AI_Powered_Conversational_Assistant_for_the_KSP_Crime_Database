import React from 'react'
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
  // Stat cards data
  const stats = [
    {
      title: 'Total FIR (YTD)',
      value: '1,428',
      change: '+12.4%',
      isPositive: false,
      icon: FileText,
      color: 'blue',
    },
    {
      title: 'Open Cases',
      value: '384',
      change: '-4.2%',
      isPositive: true,
      icon: Briefcase,
      color: 'amber',
    },
    {
      title: 'Closed Cases',
      value: '1,044',
      change: '+18.1%',
      isPositive: true,
      icon: CheckCircle,
      color: 'emerald',
    },
    {
      title: 'Wanted Criminals',
      value: '89',
      change: '+2',
      isPositive: false,
      icon: AlertTriangle,
      color: 'rose',
    },
  ]

  // Chart 1: Monthly FIR Trend
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'FIR Registered (2026)',
        data: [110, 125, 98, 140, 155, 130, 165, 142, 120, 138, 150, 168],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  // Chart 2: District Crime Breakdown
  const barChartData = {
    labels: ['Bengaluru Urban', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi'],
    datasets: [
      {
        label: 'Active Cases',
        data: [120, 65, 48, 52, 39, 44],
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

  // Recent Cases Mock
  const recentCases = [
    { id: '1', caseNumber: 'KSP-2026-0089', title: 'Cyber Fraud at MG Road Financial Hub', category: 'Cybercrime', status: 'Under Investigation', date: '2026-07-24' },
    { id: '2', caseNumber: 'KSP-2026-0088', title: 'Armed Robbery near Silk Board Flyover', category: 'Robbery', status: 'Chargesheet Filed', date: '2026-07-22' },
    { id: '3', caseNumber: 'KSP-2026-0087', title: 'Commercial Property Burglary - Indiranagar', category: 'Burglary', status: 'Registered', date: '2026-07-21' },
    { id: '4', caseNumber: 'KSP-2026-0086', title: 'Vehicle Theft Syndicate Operation', category: 'Theft', status: 'Closed', date: '2026-07-19' },
  ]

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
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.title}</span>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stat.value}</span>
              <span className={`text-xs font-bold ${stat.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.change}
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
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Annual Crime Registration Trend</h2>
              <p className="text-xs text-slate-500">Monthly FIR filing volume across Karnataka</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="h-64">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">District-wise Active Cases</h2>
              <p className="text-xs text-slate-500">Top high-density jurisdictions</p>
            </div>
            <Shield className="w-4 h-4 text-blue-500" />
          </div>
          <div className="h-64">
            <Bar data={barChartData} options={chartOptions} />
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
                {recentCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{c.caseNumber}</td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{c.title}</td>
                    <td className="p-3">{c.category}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
        </div>
      </div>
    </div>
  )
}
