// AnalyticsSection.jsx
// Admin dashboard analytics section — shows visitor stats + chart.
// This section is intentionally isolated: any error here must not crash the dashboard.

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { getAnalyticsOverview, getAnalyticsDailyVisitors } from '../../services/analyticsService'

/* ─── Custom Tooltip ─────────────────────────────────────────────────────── */

function ChartTooltip({ active, payload, label, t, i18n }) {
    if (!active || !payload?.length) return null

    let formattedDate = label
    try {
        const d = new Date(label + 'T00:00:00')
        formattedDate = d.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    } catch {
        formattedDate = label
    }

    return (
        <div className="bg-surface-container-lowest border border-outline-variant shadow-industrial px-4 py-3">
            <p className="text-xs font-bold font-headline uppercase tracking-widest text-secondary mb-1">
                {formattedDate}
            </p>
            <p className="text-2xl font-black font-headline tracking-tighter text-primary">
                {payload[0]?.value?.toLocaleString()}
            </p>
            <p className="text-xs text-secondary mt-0.5">
                {t('dashboard.analytics.visitors')}
            </p>
        </div>
    )
}

/* ─── Stat Card variant for analytics ───────────────────────────────────── */

function AnalyticsStatCard({ label, value, icon, loading, isActive }) {
    return (
        <div className={`p-6 relative overflow-hidden group ${isActive ? 'voltage-gradient' : 'bg-surface-container-lowest'} border-l rtl:border-l-0 rtl:border-r border-outline-variant border-opacity-10`}>
            <div className="relative z-10">
                <p className={`text-xs font-bold font-headline uppercase tracking-widest mb-3 ${isActive ? 'text-on-primary-container' : 'text-secondary'}`}>
                    {label}
                </p>
                <div className="flex items-baseline gap-2">
                    {isActive && (
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)] shrink-0 mb-0.5 animate-pulse" />
                    )}
                    <span className={`text-4xl font-black font-headline tracking-tighter ${isActive ? 'text-white' : 'text-primary'}`}>
                        {loading ? '—' : value?.toLocaleString() ?? '—'}
                    </span>
                </div>
            </div>
            <span className={`material-symbols-outlined absolute -right-4 rtl:-left-4 rtl:right-auto -bottom-4 text-9xl pointer-events-none transition-colors ${isActive ? 'text-white opacity-5' : 'text-surface-container opacity-50'}`}>
                {icon}
            </span>
        </div>
    )
}

/* ─── Chart skeleton ─────────────────────────────────────────────────────── */

function ChartSkeleton() {
    return (
        <div className="h-64 bg-surface-container-low flex items-center justify-center">
            <div className="flex items-end gap-1 h-32">
                {Array.from({ length: 15 }).map((_, i) => (
                    <div
                        key={i}
                        className="w-4 bg-outline-variant animate-pulse"
                        style={{ height: `${30 + Math.sin(i * 0.8) * 40 + 20}%`, animationDelay: `${i * 50}ms` }}
                    />
                ))}
            </div>
        </div>
    )
}

/* ─── Main Section ───────────────────────────────────────────────────────── */

export default function AnalyticsSection() {
    const { t, i18n } = useTranslation()

    const [overview, setOverview] = useState(null)
    const [dailyData, setDailyData] = useState([])
    const [loadingOverview, setLoadingOverview] = useState(true)
    const [loadingChart, setLoadingChart] = useState(true)
    const [overviewError, setOverviewError] = useState(false)
    const [chartError, setChartError] = useState(false)

    const fetchOverview = useCallback(() => {
        getAnalyticsOverview()
            .then((data) => {
                setOverview(data)
                setOverviewError(false)
            })
            .catch(() => setOverviewError(true))
            .finally(() => setLoadingOverview(false))
    }, [])

    const fetchChart = useCallback(() => {
        getAnalyticsDailyVisitors(30)
            .then((data) => {
                setDailyData(data)
                setChartError(false)
            })
            .catch(() => setChartError(true))
            .finally(() => setLoadingChart(false))
    }, [])

    useEffect(() => {
        fetchOverview()
        fetchChart()

        // Poll active visitor overview every 30 seconds for live updates
        const intervalId = setInterval(fetchOverview, 30_000)
        return () => clearInterval(intervalId)
    }, [fetchOverview, fetchChart])

    const statCards = [
        {
            label: t('dashboard.analytics.active_visitors'),
            value: overview?.activeVisitors,
            icon: 'sensors',
            isActive: true,
        },
        {
            label: t('dashboard.analytics.today'),
            value: overview?.todayVisitors,
            icon: 'today',
            isActive: false,
        },
        {
            label: t('dashboard.analytics.this_month'),
            value: overview?.thisMonthVisitors,
            icon: 'calendar_month',
            isActive: false,
        },
        {
            label: t('dashboard.analytics.last_month'),
            value: overview?.lastMonthVisitors,
            icon: 'history',
            isActive: false,
        },
    ]

    const hasAnyVisitors = dailyData.some((d) => d.visitors > 0)

    return (
        <div className="mb-12">
            {/* Section header */}
            <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                    <h3 className="text-xl font-black font-headline tracking-tighter text-primary uppercase">
                        {t('dashboard.analytics.title')}
                    </h3>
                    <div className="flex-1 h-px bg-outline-variant" />
                </div>
            </div>

            {/* Overview error banner */}
            {overviewError && (
                <div className="mb-4 flex items-center gap-3 bg-error-container border-l-4 rtl:border-l-0 rtl:border-r-4 border-error p-4 text-on-error-container">
                    <span className="material-symbols-outlined text-error shrink-0">warning</span>
                    <p className="text-sm font-bold">{t('dashboard.analytics.error')}</p>
                </div>
            )}

            {/* Stat cards grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {statCards.map((card) => (
                    <AnalyticsStatCard
                        key={card.label}
                        label={card.label}
                        value={card.value}
                        icon={card.icon}
                        loading={loadingOverview}
                        isActive={card.isActive}
                    />
                ))}
            </div>

            {/* Chart section */}
            <div className="bg-surface-container-lowest border-l rtl:border-l-0 rtl:border-r border-outline-variant border-opacity-10 p-6">
                <p className="text-xs font-bold font-headline uppercase tracking-widest text-secondary mb-6">
                    {t('dashboard.analytics.chart_title')}
                </p>

                {loadingChart && <ChartSkeleton />}

                {!loadingChart && chartError && (
                    <div className="h-48 flex flex-col items-center justify-center gap-2 text-secondary">
                        <span className="material-symbols-outlined text-4xl text-outline-variant">bar_chart_off</span>
                        <p className="text-sm font-bold font-headline uppercase tracking-widest">
                            {t('dashboard.analytics.chart_error')}
                        </p>
                    </div>
                )}

                {!loadingChart && !chartError && dailyData.length === 0 && (
                    <div className="h-48 flex flex-col items-center justify-center gap-2 text-secondary">
                        <span className="material-symbols-outlined text-4xl text-outline-variant">bar_chart</span>
                        <p className="text-sm font-bold font-headline uppercase tracking-widest">
                            {t('dashboard.analytics.chart_empty')}
                        </p>
                    </div>
                )}

                {!loadingChart && !chartError && dailyData.length > 0 && (
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={dailyData}
                                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#000e24" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#000e24" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#c4c6d0"
                                    strokeOpacity={0.5}
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: '#74777f', fontFamily: 'Space Grotesk, Cairo, sans-serif', fontWeight: 700 }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#c4c6d0', strokeOpacity: 0.5 }}
                                    interval={Math.ceil(dailyData.length / 7) - 1}
                                    tickFormatter={(val) => {
                                        try {
                                            const d = new Date(val + 'T00:00:00')
                                            return d.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })
                                        } catch {
                                            return val
                                        }
                                    }}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#74777f', fontFamily: 'Space Grotesk, Cairo, sans-serif', fontWeight: 700 }}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                    tickFormatter={(val) => val.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                                />
                                <Tooltip content={<ChartTooltip t={t} i18n={i18n} />} />
                                <Area
                                    type="monotone"
                                    dataKey="visitors"
                                    stroke="#000e24"
                                    strokeWidth={2}
                                    fill="url(#analyticsGradient)"
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#000e24', strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    )
}
