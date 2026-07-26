import React from 'react'
import { BarChart3, TrendingUp, Shield, MapPin, Download } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function AnalyticsPage() {
  const categoryData = {
    labels: ['Cybercrime', 'Theft', 'Burglary', 'Robbery', 'Fraud', 'Others'],
    datasets: [
      {
        data: [35, 25, 15, 12, 8, 5],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'],
      },
    ],
  }

  const predictionData = {
    labels: ['May', 'Jun', 'Jul', 'Aug (Pred)', 'Sep (Pred)', 'Oct (Pred)'],
    datasets: [
      {
        label: 'Historical / Projected FIR Volume',
        data: [140, 155, 168, 172, 165, 180],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        borderDash: [5, 5],
      },
    ],
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Statewide Crime Analytics & Predictive Intelligence</h1>
          <p className="text-xs text-slate-500">Karnataka State Crime Trend Forecasting & Spatial Heatmaps</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-md">
          <Download className="w-4 h-4" />
          <span>Export Analytics PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Crime Category Distribution</h2>
          <div className="h-64 flex justify-center">
            <Doughnut data={categoryData} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">AI Predictive Crime Volume Projection</h2>
          <div className="h-64">
            <Line data={predictionData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  )
}
