import { useState, useEffect } from 'react'
import { StatCard } from '../components/ui/StatCard'
import { getDashboardStats } from '../services/dashboardService'

export default function Dashboard() {
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
      label: 'Total Products',
      value: loading ? '—' : stats?.totalProducts ?? 0,
      trend: 'items',
      icon: 'inventory_2',
      variant: 'default',
    },
    {
      label: 'Total Projects',
      value: loading ? '—' : stats?.totalProjects ?? 0,
      trend: 'projects',
      icon: 'account_tree',
      variant: 'tertiary',
    },
    {
      label: 'Quote Requests',
      value: loading ? '—' : stats?.newQuotes ?? 0,
      trend: 'PENDING',
      icon: 'request_quote',
      variant: 'default',
      badge: true,
    },
    {
      label: 'Visit Requests',
      value: loading ? '—' : stats?.newVisits ?? 0,
      trend: 'PENDING',
      icon: 'factory',
      variant: 'gradient',
      badge: true,
    },
  ]

  return (
    <div>
      {/* Page Header */}
      <div className="mb-12">
        <h2 className="text-5xl font-black font-headline tracking-tighter text-primary uppercase leading-none">
          Operational Overview
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0.5 bg-outline-variant bg-opacity-10 mb-12">
        {statCardsData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  )
}