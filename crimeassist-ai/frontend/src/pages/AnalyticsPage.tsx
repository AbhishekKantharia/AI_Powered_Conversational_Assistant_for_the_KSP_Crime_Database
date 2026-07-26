import { Download } from 'lucide-react'
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
  Filler,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { useDistrictComparison, useCriminalStats, usePredictionData, useDashboardData } from '../hooks/useAPI'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { color: 'rgba(148, 163, 184, 0.1)' } },
  },
}

export default function AnalyticsPage() {
  const { data: dashboard } = useDashboardData()
  const { data: districtData, isLoading: loadingDistricts } = useDistrictComparison()
  const { data: criminalStats, isLoading: loadingCriminal } = useCriminalStats()
  const { data: predictionData, isLoading: loadingPrediction } = usePredictionData()

  const categoryData = {
    labels: dashboard?.crimeByCategory?.map((c) => c.crime_category.replace(/_/g, ' ')) ?? [],
    datasets: [
      {
        data: dashboard?.crimeByCategory?.map((c) => c.count) ?? [],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#ec4899', '#14b8a6'],
      },
    ],
  }

  const districtChartData = {
    labels: districtData?.map((d: Record<string, unknown>) => d.district as string) ?? [],
    datasets: [
      {
        label: 'Total FIR',
        data: districtData?.map((d: Record<string, unknown>) => parseInt(d.total_fir as string) || 0) ?? [],
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
      {
        label: 'Open Cases',
        data: districtData?.map((d: Record<string, unknown>) => parseInt(d.open_cases as string) || 0) ?? [],
        backgroundColor: '#f59e0b',
        borderRadius: 6,
      },
    ],
  }

  const predictionChartData = {
    labels: predictionData?.map((p: Record<string, unknown>) => {
      const date = new Date(p.month as string)
      return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    }) ?? [],
    datasets: [
      {
        label: 'FIR Volume (Historical)',
        data: predictionData?.map((p: Record<string, unknown>) => parseInt(p.count as string) || 0) ?? [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: '3-Month Moving Average',
        data: predictionData?.map((p: Record<string, unknown>) => Math.round(parseFloat(p.moving_avg_3 as string) || 0)) ?? [],
        borderColor: '#8b5cf6',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
      },
    ],
  }

  const riskData = {
    labels: criminalStats?.riskDistribution?.map((r) => r.risk_level) ?? [],
    datasets: [
      {
        data: criminalStats?.riskDistribution?.map((r) => parseInt(r.count as unknown as string) || 0) ?? [],
        backgroundColor: ['#22c55e', '#f59e0b', '#f97316', '#ef4444'],
      },
    ],
  }

  const ageData = {
    labels: criminalStats?.ageGroups?.map((a) => a.age_group) ?? [],
    datasets: [
      {
        label: 'Criminals',
        data: criminalStats?.ageGroups?.map((a) => parseInt(a.count as unknown as string) || 0) ?? [],
        backgroundColor: '#1d4ed8',
        borderRadius: 8,
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

      {/* Row 1: Crime Category & Risk Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Crime Category Distribution</h2>
          <div className="h-64 flex justify-center">
            {loadingDistricts ? (
              <div className="h-full w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ) : (
              <Doughnut data={categoryData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } } }} />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Criminal Risk Level Distribution</h2>
          <div className="h-64 flex justify-center">
            {loadingCriminal ? (
              <div className="h-full w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ) : (
              <Doughnut data={riskData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } } }} />
            )}
          </div>
        </div>
      </div>

      {/* Row 2: District Comparison */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">District-wise Crime Comparison</h2>
        <div className="h-72">
          {loadingDistricts ? (
            <div className="h-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ) : (
            <Bar data={districtChartData} options={{ ...chartOptions, plugins: { legend: { display: true, position: 'top' } } }} />
          )}
        </div>
      </div>

      {/* Row 3: Prediction & Age */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">AI Crime Volume Prediction</h2>
          <div className="h-64">
            {loadingPrediction ? (
              <div className="h-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ) : (
              <Line data={predictionChartData} options={{ ...chartOptions, plugins: { legend: { display: true, position: 'top' } } }} />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Criminal Age Distribution</h2>
          <div className="h-64">
            {loadingCriminal ? (
              <div className="h-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ) : (
              <Bar data={ageData} options={chartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Wanted by District */}
      {criminalStats?.wantedByDistrict && criminalStats.wantedByDistrict.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Wanted Criminals by District</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {criminalStats.wantedByDistrict.map((d, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                <p className="text-lg font-extrabold text-rose-500">{d.wanted_count}</p>
                <p className="text-[10px] font-semibold text-slate-500 mt-1">{d.district}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
