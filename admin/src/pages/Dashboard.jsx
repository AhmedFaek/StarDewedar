import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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

  const pendingQuotes = stats?.newQuotes ?? 0
  const pendingVisits = stats?.newVisits ?? 0
  const pendingBOQs   = stats?.newBOQs ?? 0
  const hasPending = !loading && (pendingQuotes > 0 || pendingVisits > 0 || pendingBOQs > 0)

  const statCardsData = [
    {
      label: t('dashboard.total_products'),
      value: loading ? '—' : stats?.totalProducts ?? 0,
      trend: t('dashboard.catalog_items'),
      icon: 'inventory_2',
      variant: 'default',
      link: '/products',
    },
    {
      label: t('dashboard.total_projects'),
      value: loading ? '—' : stats?.totalProjects ?? 0,
      trend: t('dashboard.active_projects'),
      icon: 'account_tree',
      variant: 'tertiary',
      link: '/projects',
    },
    {
      label: t('dashboard.quote_requests'),
      value: loading ? '—' : pendingQuotes,
      trend: t('dashboard.pending'),
      icon: 'request_quote',
      variant: 'default',
      badge: true,
      link: '/requests?tab=quote',
    },
    {
      label: t('dashboard.visit_requests'),
      value: loading ? '—' : pendingVisits,
      trend: t('dashboard.pending'),
      icon: 'factory',
      variant: 'gradient',
      badge: true,
      link: '/requests?tab=visit',
    },
    {
      label: t('dashboard.boq_requests'),
      value: loading ? '—' : pendingBOQs,
      trend: t('dashboard.pending'),
      icon: 'receipt_long',
      variant: 'default',
      badge: true,
      link: '/requests?tab=boq',
    },
    {
      label: t('dashboard.contact_messages'),
      value: loading ? '—' : stats?.totalContactMessages ?? 0,
      trend: t('dashboard.received_messages'),
      icon: 'chat',
      variant: 'default',
      link: '/messages',
    },
    {
      label: t('dashboard.total_customers'),
      value: loading ? '—' : stats?.totalCustomers ?? 0,
      trend: t('dashboard.registered_customers'),
      icon: 'group',
      variant: 'tertiary',
      link: '/users',
    },
  ]

  return (
    <div>
      <div className="mb-8 sm:mb-10 lg:mb-12">
        <h2 className="text-3xl font-black font-headline tracking-tighter text-primary uppercase leading-none sm:text-4xl lg:text-5xl">
          {t('dashboard.title')}
        </h2>
      </div>

      {/* Alert banner for pending requests */}
      {hasPending && (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-amber-500/10 border-l-4 rtl:border-l-0 rtl:border-r-4 border-amber-500 p-5 sm:p-6 text-primary shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-3xl shrink-0">warning</span>
            <div>
              <h4 className="font-headline font-bold text-sm uppercase tracking-wider text-amber-900">{t('dashboard.pending_alert_title')}</h4>
              <p className="text-xs sm:text-sm text-secondary mt-0.5">
                {t('dashboard.pending_alert_desc')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {pendingQuotes > 0 && (
              <Link to="/requests?tab=quote" className="px-4 py-2 bg-amber-500 text-white font-headline text-xs font-bold uppercase tracking-widest hover:bg-amber-600 transition-colors inline-flex items-center gap-1.5 shadow-xs">
                <span>{t('dashboard.quote_requests')}</span>
                <span className="bg-white/20 px-2 py-0.5 text-[10px]">{pendingQuotes}</span>
              </Link>
            )}
            {pendingVisits > 0 && (
              <Link to="/requests?tab=visit" className="px-4 py-2 bg-primary text-white font-headline text-xs font-bold uppercase tracking-widest hover:bg-primary-container transition-colors inline-flex items-center gap-1.5 shadow-xs">
                <span>{t('dashboard.visit_requests')}</span>
                <span className="bg-white/20 px-2 py-0.5 text-[10px]">{pendingVisits}</span>
              </Link>
            )}
            {pendingBOQs > 0 && (
              <Link to="/requests?tab=boq" className="px-4 py-2 bg-emerald-600 text-white font-headline text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 shadow-xs">
                <span>{t('dashboard.boq_requests')}</span>
                <span className="bg-white/20 px-2 py-0.5 text-[10px]">{pendingBOQs}</span>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCardsData.map((stat, index) =>
          stat.link ? (
            <Link key={index} to={stat.link} className="block transition-transform hover:scale-[1.01]">
              <StatCard {...stat} />
            </Link>
          ) : (
            <StatCard key={index} {...stat} />
          )
        )}
      </div>
    </div>
  )
}
