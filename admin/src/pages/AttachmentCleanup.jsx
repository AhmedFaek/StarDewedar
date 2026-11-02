import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components'
import { formatDate } from '../utils/helpers'
import { getCleanupOperations, retryCleanupOperation } from '../services/attachmentCleanupService'

const PAGE_SIZE = 50
const STALE_PROCESSING_MS = 5 * 60 * 1000

const STATUS_STYLES = {
    PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
    PROCESSING: 'bg-blue-50 text-blue-800 border-blue-200',
    FAILED: 'bg-red-50 text-red-800 border-red-200',
    COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
}

const canRetryOperation = (operation) =>
    operation.status === 'PENDING' ||
    operation.status === 'FAILED' ||
    (
        operation.status === 'PROCESSING' &&
        Date.now() - new Date(operation.updated_at).getTime() >= STALE_PROCESSING_MS
    )

export default function AttachmentCleanup() {
    const { t, i18n } = useTranslation()
    const isAr = i18n.language === 'ar'
    const [status, setStatus] = useState('')
    const [page, setPage] = useState(0)
    const [operations, setOperations] = useState([])
    const [loading, setLoading] = useState(true)
    const [retryingId, setRetryingId] = useState(null)
    const [error, setError] = useState(null)

    const loadOperations = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const result = await getCleanupOperations({
                status: status || undefined,
                take: PAGE_SIZE,
                skip: page * PAGE_SIZE,
            })
            setOperations(result)
        } catch (loadError) {
            console.error('Failed to load attachment cleanup operations:', loadError)
            setError(t('attachmentCleanup.loadError'))
        } finally {
            setLoading(false)
        }
    }, [page, status, t])

    useEffect(() => {
        loadOperations()
    }, [loadOperations])

    const handleRetry = async (operationId) => {
        setRetryingId(operationId)
        setError(null)
        try {
            await retryCleanupOperation(operationId)
            await loadOperations()
        } catch (retryError) {
            console.error('Failed to retry attachment cleanup:', retryError)
            setError(t('attachmentCleanup.retryError'))
        } finally {
            setRetryingId(null)
        }
    }

    const statusLabel = (operationStatus) =>
        t(`attachmentCleanup.status.${operationStatus.toLowerCase()}`, {
            defaultValue: operationStatus,
        })

    const requestTypeLabel = (requestType) =>
        t(`attachmentCleanup.requestType.${requestType.toLowerCase()}`, {
            defaultValue: requestType,
        })

    const errorLabel = (errorCode) =>
        t(`attachmentCleanup.errors.${errorCode}`, {
            defaultValue: t('attachmentCleanup.errors.unknown'),
        })

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-headline text-2xl font-black text-on-surface">
                        {t('attachmentCleanup.title')}
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-secondary">
                        {t('attachmentCleanup.description')}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={status}
                        onChange={(event) => {
                            setPage(0)
                            setStatus(event.target.value)
                        }}
                        className="border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface"
                        aria-label={t('attachmentCleanup.filterLabel')}
                    >
                        <option value="">
                            {t('attachmentCleanup.filter.attention')}
                        </option>
                        {['PENDING', 'PROCESSING', 'FAILED', 'COMPLETED'].map((value) => (
                            <option key={value} value={value}>{statusLabel(value)}</option>
                        ))}
                    </select>
                    <Button variant="outline" onClick={loadOperations} disabled={loading}>
                        {t('attachmentCleanup.refresh')}
                    </Button>
                </div>
            </header>

            {error && (
                <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
                    {error}
                </p>
            )}

            <section className="overflow-hidden border border-outline-variant bg-white">
                {loading ? (
                    <p className="p-6 text-sm text-secondary">
                        {t('attachmentCleanup.loading')}
                    </p>
                ) : operations.length === 0 ? (
                    <p className="p-6 text-sm text-secondary">
                        {t('attachmentCleanup.empty')}
                    </p>
                ) : (
                    <div className="divide-y divide-outline-variant">
                        {operations.map((operation) => (
                            <article key={operation.id} className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                                <div className="min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[operation.status] || STATUS_STYLES.FAILED}`}>
                                            {statusLabel(operation.status)}
                                        </span>
                                        <span className="text-xs font-bold uppercase text-secondary">
                                            {requestTypeLabel(operation.request_type)}
                                        </span>
                                        <span className="font-mono text-[11px] text-secondary">
                                            {operation.request_id}
                                        </span>
                                    </div>
                                    <p className="truncate text-sm font-semibold text-on-surface">
                                        {operation.attachment?.original_filename || t('attachmentCleanup.unknownFile')}
                                    </p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary">
                                        <span>
                                            {t('attachmentCleanup.attempts')}: {operation.attempt_count}
                                        </span>
                                        <span>
                                            {t('attachmentCleanup.updated')}:{' '}
                                            {formatDate(operation.updated_at, isAr ? 'ar' : 'en-US')}
                                        </span>
                                    </div>
                                    {operation.error_code && (
                                        <p className="text-xs font-medium text-red-700">{errorLabel(operation.error_code)}</p>
                                    )}
                                </div>
                                {canRetryOperation(operation) && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRetry(operation.id)}
                                        disabled={retryingId !== null}
                                    >
                                        {retryingId === operation.id
                                            ? t('attachmentCleanup.retrying')
                                            : t('attachmentCleanup.retry')}
                                    </Button>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                    disabled={page === 0 || loading}
                >
                    {t('attachmentCleanup.previous')}
                </Button>
                <span className="text-xs font-medium text-secondary">
                    {t('attachmentCleanup.page')} {page + 1}
                </span>
                <Button
                    variant="ghost"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={loading || operations.length < PAGE_SIZE}
                >
                    {t('attachmentCleanup.next')}
                </Button>
            </div>
        </div>
    )
}
