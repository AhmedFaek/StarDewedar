import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StatCard } from '../components/ui/StatCard'
import { getDashboardStats } from '../services/dashboardService'

export default function Dashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCardsData = [
    {
      label: t('dashboard.total_products'),
      value: loading ? '—' : stats?.totalProducts ?? 0,
      trend: t('dashboard.catalog_items'),
      icon: 'inventory_2',
      variant: 'default',
    },
    {
      label: t('dashboard.total_projects'),
      value: loading ? '—' : stats?.totalProjects ?? 0,
      trend: t('dashboard.active_projects'),
      icon: 'account_tree',
      variant: 'tertiary',
    },
    {
      label: t('dashboard.quote_requests'),
      value: loading ? '—' : stats?.newQuotes ?? 0,
      trend: t('dashboard.pending'),
      icon: 'request_quote',
      variant: 'default',
      badge: true,
    },
    {
      label: t('dashboard.visit_requests'),
      value: loading ? '—' : stats?.newVisits ?? 0,
      trend: t('dashboard.pending'),
      icon: 'factory',
      variant: 'gradient',
      badge: true,
    },
  ]

  return (
    <div>
      <div className="mb-12">
        <h2 className="text-5xl font-black font-headline tracking-tighter text-primary uppercase leading-none">
          {t('dashboard.title')}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0.5 bg-outline-variant bg-opacity-10 mb-12">
        {statCardsData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  )
}