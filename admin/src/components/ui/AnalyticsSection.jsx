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
import { StatCard } from './StatCard'

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
        <div className="rounded-lg border border-slate-200 bg-white shadow-lg px-4 py-3 min-w-[140px]">
            <p className="text-[11px] font-bold font-headline uppercase tracking-wider text-slate-500 mb-1">
                {formattedDate}
            </p>
            <p className="text-2xl font-black font-headline tracking-tight text-primary">
                {payload[0]?.value?.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
                {t('dashboard.analytics.visitors', 'visitors')}
            </p>
        </div>
    )
}

/* ─── Chart skeleton ─────────────────────────────────────────────────────── */

function ChartSkeleton() {
    return (
        <div className="h-64 rounded-lg bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
            <div className="flex items-end gap-1.5 h-32">
                {Array.from({ length: 18 }).map((_, i) => (
                    <div
                        key={i}
                        className="w-3.5 rounded-t bg-slate-200 animate-pulse"
                        style={{ height: `${25 + Math.sin(i * 0.7) * 45 + 20}%`, animationDelay: `${i * 45}ms` }}
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
                setDailyData(data || [])
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

    const thisMonth = overview?.thisMonthVisitors ?? 0
    const lastMonth = overview?.lastMonthVisitors ?? 0

    // Compute month-over-month trend indicator
    let monthTrend = null
    if (!loadingOverview) {
        if (lastMonth > 0) {
            const pct = Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
            monthTrend = {
                value: `${pct >= 0 ? '+' : ''}${pct}%`,
                isPositive: pct >= 0,
                isNegative: pct < 0,
                label: t('dashboard.analytics.vs_last_month', 'vs last month'),
            }
        } else if (lastMonth === 0 && thisMonth > 0) {
            monthTrend = {
                value: `+${thisMonth}`,
                isPositive: true,
                label: t('dashboard.analytics.vs_last_month', 'vs last month'),
            }
        }
    }

    const statCards = [
        {
            label: t('dashboard.analytics.active_visitors'),
            value: overview?.activeVisitors ?? 0,
            icon: 'sensors',
            accent: 'emerald',
            isLive: true,
            loading: loadingOverview,
        },
        {
            label: t('dashboard.analytics.today'),
            value: overview?.todayVisitors ?? 0,
            icon: 'today',
            accent: 'blue',
            subtitle: t('dashboard.analytics.today_sub', 'Unique visits today'),
            loading: loadingOverview,
        },
        {
            label: t('dashboard.analytics.this_month'),
            value: thisMonth,
            icon: 'calendar_month',
            accent: 'indigo',
            trend: monthTrend,
            subtitle: !monthTrend ? t('dashboard.analytics.this_month_sub', 'Visits this month') : undefined,
            loading: loadingOverview,
        },
        {
            label: t('dashboard.analytics.last_month'),
            value: lastMonth,
            icon: 'history',
            accent: 'slate',
            subtitle: t('dashboard.analytics.last_month_sub', 'Previous month total'),
            loading: loadingOverview,
        },
    ]

    const totalVisitors30Days = dailyData.reduce((acc, curr) => acc + (curr.visitors || 0), 0)

    return (
        <div className="mb-12">
            {/* Section header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary border border-blue-200/80">
                        <span className="material-symbols-outlined text-lg">monitoring</span>
                    </span>
                    <div>
                        <h3 className="text-xl font-black font-headline tracking-tight text-slate-900 uppercase">
                            {t('dashboard.analytics.title')}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                            {t('dashboard.analytics.subtitle', 'Real-time traffic and monthly visitor trends')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Overview error banner */}
            {overviewError && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
                    <span className="material-symbols-outlined text-red-600 shrink-0">warning</span>
                    <p className="text-sm font-bold">{t('dashboard.analytics.error')}</p>
                </div>
            )}

            {/* Stat cards grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {statCards.map((card, idx) => (
                    <StatCard key={idx} {...card} />
                ))}
            </div>

            {/* Chart section */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold font-headline uppercase tracking-wider text-slate-600">
                            {t('dashboard.analytics.chart_title')}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {t('dashboard.analytics.chart_subtitle', 'Daily unique visitor volume over time')}
                        </p>
                    </div>

                    {!loadingChart && dailyData.length > 0 && (
                        <div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full border border-blue-200/80 bg-blue-50/70 px-3.5 py-1 text-xs font-bold font-headline uppercase tracking-wider text-primary">
                            <span className="material-symbols-outlined text-[15px] leading-none">insights</span>
                            <span>
                                {t('dashboard.analytics.total_30_days', {
                                    count: totalVisitors30Days.toLocaleString(),
                                    defaultValue: `${totalVisitors30Days.toLocaleString()} total visits in 30 days`,
                                })}
                            </span>
                        </div>
                    )}
                </div>

                {loadingChart && <ChartSkeleton />}

                {!loadingChart && chartError && (
                    <div className="h-52 flex flex-col items-center justify-center gap-2 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-slate-500">
                        <span className="material-symbols-outlined text-4xl text-slate-400">bar_chart_off</span>
                        <p className="text-sm font-bold font-headline uppercase tracking-wider">
                            {t('dashboard.analytics.chart_error')}
                        </p>
                    </div>
                )}

                {!loadingChart && !chartError && dailyData.length === 0 && (
                    <div className="h-52 flex flex-col items-center justify-center gap-2 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-slate-500">
                        <span className="material-symbols-outlined text-4xl text-slate-400">bar_chart</span>
                        <p className="text-sm font-bold font-headline uppercase tracking-wider">
                            {t('dashboard.analytics.chart_empty')}
                        </p>
                    </div>
                )}

                {!loadingChart && !chartError && dailyData.length > 0 && (
                    <div className="h-64 sm:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={dailyData}
                                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1B75BA" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#1B75BA" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#E2E8F0"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Space Grotesk, Cairo, sans-serif', fontWeight: 600 }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#E2E8F0' }}
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
                                    tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Space Grotesk, Cairo, sans-serif', fontWeight: 600 }}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                    tickFormatter={(val) => val.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                                />
                                <Tooltip content={<ChartTooltip t={t} i18n={i18n} />} />
                                <Area
                                    type="monotone"
                                    dataKey="visitors"
                                    stroke="#1B75BA"
                                    strokeWidth={2.5}
                                    fill="url(#analyticsGradient)"
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#1B75BA', stroke: '#ffffff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    )
}
