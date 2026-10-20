import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { StatCard } from '../components/ui/StatCard'
import { getDashboardStats } from '../services/dashboardService'
import AnalyticsSection from '../components/ui/AnalyticsSection'

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

  // Request & Action Cards (Semantic Category: Amber)
  const requestCards = [
    {
      label: t('dashboard.quote_requests'),
      value: loading ? '—' : pendingQuotes,
      icon: 'request_quote',
      accent: 'amber',
      statusType: 'pending',
      pendingCount: pendingQuotes,
      isClickable: true,
      link: '/requests?tab=quote',
      loading,
    },
    {
      label: t('dashboard.visit_requests'),
      value: loading ? '—' : pendingVisits,
      icon: 'factory',
      accent: 'amber',
      statusType: 'pending',
      pendingCount: pendingVisits,
      isClickable: true,
      link: '/requests?tab=visit',
      loading,
    },
    {
      label: t('dashboard.boq_requests'),
      value: loading ? '—' : pendingBOQs,
      icon: 'receipt_long',
      accent: 'amber',
      statusType: 'pending',
      pendingCount: pendingBOQs,
      isClickable: true,
      link: '/requests?tab=boq',
      loading,
    },
  ]

  // Core Overview & Operations Cards (Semantic Categories: Blue & Indigo)
  const overviewCards = [
    {
      label: t('dashboard.total_products'),
      value: loading ? '—' : stats?.totalProducts ?? 0,
      subtitle: t('dashboard.catalog_sub', 'Active items in catalog'),
      icon: 'inventory_2',
      accent: 'blue',
      isClickable: true,
      link: '/products',
      loading,
    },
    {
      label: t('dashboard.total_projects'),
      value: loading ? '—' : stats?.totalProjects ?? 0,
      subtitle: t('dashboard.projects_sub', 'Published portfolio projects'),
      icon: 'account_tree',
      accent: 'blue',
      isClickable: true,
      link: '/projects',
      loading,
    },
    {
      label: t('dashboard.contact_messages'),
      value: loading ? '—' : stats?.totalContactMessages ?? 0,
      subtitle: t('dashboard.messages_sub', 'Direct inquiries received'),
      icon: 'chat',
      accent: 'indigo',
      isClickable: true,
      link: '/messages',
      loading,
    },
    {
      label: t('dashboard.total_customers'),
      value: loading ? '—' : stats?.totalCustomers ?? 0,
      subtitle: t('dashboard.customers_sub', 'Registered client accounts'),
      icon: 'group',
      accent: 'indigo',
      isClickable: true,
      link: '/users',
      loading,
    },
  ]

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 sm:mb-10">
        <h2 className="text-3xl font-black font-headline tracking-tighter text-slate-900 uppercase leading-none sm:text-4xl lg:text-5xl">
          {t('dashboard.title')}
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium max-w-2xl">
          {t('dashboard.subtitle', 'Real-time summary of store operations, customer requests, and website performance')}
        </p>
      </div>

      {/* Alert banner for pending requests */}
      {hasPending && (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-amber-200/90 bg-amber-50/70 p-5 sm:p-6 text-slate-800 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
              <span className="material-symbols-outlined text-2xl select-none">priority_high</span>
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm uppercase tracking-wider text-amber-950">
                {t('dashboard.pending_alert_title')}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {t('dashboard.pending_alert_desc')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {pendingQuotes > 0 && (
              <Link
                to="/requests?tab=quote"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold font-headline uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-amber-600"
              >
                <span>{t('dashboard.quote_requests')}</span>
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-black">{pendingQuotes}</span>
              </Link>
            )}
            {pendingVisits > 0 && (
              <Link
                to="/requests?tab=visit"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold font-headline uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-primary-container"
              >
                <span>{t('dashboard.visit_requests')}</span>
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-black">{pendingVisits}</span>
              </Link>
            )}
            {pendingBOQs > 0 && (
              <Link
                to="/requests?tab=boq"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold font-headline uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-emerald-700"
              >
                <span>{t('dashboard.boq_requests')}</span>
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-black">{pendingBOQs}</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Section 1: Pending Inquiries & Requests */}
      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-600 border border-amber-200/80">
              <span className="material-symbols-outlined text-base">notifications_active</span>
            </span>
            <div>
              <h3 className="text-base font-black font-headline tracking-tight text-slate-900 uppercase">
                {t('dashboard.section_requests', 'Pending Inquiries & Requests')}
              </h3>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            {t('dashboard.section_requests_desc', 'Customer actions requiring prompt review')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {requestCards.map((stat, index) => (
            <Link key={index} to={stat.link} className="block group">
              <StatCard {...stat} />
            </Link>
          ))}
        </div>
      </div>

      {/* Section 2: Catalog & Operations Overview */}
      <div className="mb-12">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-primary border border-blue-200/80">
              <span className="material-symbols-outlined text-base">dashboard_customize</span>
            </span>
            <div>
              <h3 className="text-base font-black font-headline tracking-tight text-slate-900 uppercase">
                {t('dashboard.section_overview', 'Catalog & Operations')}
              </h3>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            {t('dashboard.section_overview_desc', 'Core business metrics and client engagement')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {overviewCards.map((stat, index) => (
            <Link key={index} to={stat.link} className="block group">
              <StatCard {...stat} />
            </Link>
          ))}
        </div>
      </div>

      {/* Section 3: Website Analytics */}
      <AnalyticsSection />
    </div>
  )
}
