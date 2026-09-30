import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { api } from '../utils/api'
import { isLoggedIn } from '../utils/auth'
import { getApiErrorMessage } from '../utils/apiErrorHandler'
import { useNotification } from '../hooks/useNotification'

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatRelativeTime(dateStr, lang) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (lang === 'ar') {
    if (diffMins < 1) return 'الآن'
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    if (diffDays < 7) return `منذ ${diffDays} يوم`
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
}

/* ─── New Conversation Modal ──────────────────────────────────────────────── */

function NewConversationModal({ onClose, onCreate, t }) {
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { showError } = useNotification()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !content.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await api.createConversation({
        subject: subject.trim(),
        content: content.trim(),
        message_type: 'TEXT',
      })
      onCreate(result.data.conversation)
    } catch (err) {
      setError(getApiErrorMessage(err, { t }))
    } finally {
      setLoading(false)
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full max-w-lg shadow-2xl animate-[slideDown_0.2s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-headline font-black text-primary text-lg uppercase tracking-tight">
              {t('messages.newConversation')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-body">{t('messages.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-body">
              {error}
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block font-headline font-bold text-[11px] uppercase tracking-widest text-slate-700 mb-1.5">
              {t('messages.subject')} <span className="text-red-500">*</span>
            </label>
            <input
              id="new-conv-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={100}
              placeholder={t('messages.subjectPlaceholder')}
              className="w-full border border-slate-200 px-3 py-2.5 text-sm font-body text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              required
              disabled={loading}
            />
            <p className="text-[10px] text-slate-400 mt-1 text-right font-mono">
              {subject.length}/100
            </p>
          </div>

          {/* Message */}
          <div>
            <label className="block font-headline font-bold text-[11px] uppercase tracking-widest text-slate-700 mb-1.5">
              {t('messages.firstMessage')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="new-conv-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder={t('messages.firstMessagePlaceholder')}
              className="w-full border border-slate-200 px-3 py-2.5 text-sm font-body text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
              required
              disabled={loading}
            />
            <p className="text-[10px] text-slate-400 mt-1 text-right font-mono">
              {content.length}/2000
            </p>
          </div>

          <button
            id="new-conv-submit"
            type="submit"
            disabled={loading || !subject.trim() || !content.trim()}
            className="w-full py-3 bg-primary text-white font-headline font-bold uppercase text-xs tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('messages.creating')}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">send</span>
                {t('messages.createConversation')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ─── Conversation Row ────────────────────────────────────────────────────── */

function ConversationRow({ conv, onClick, t, lang }) {
  const isAwaitingReply = conv.last_message_sender_type === 'CUSTOMER'
  const isClosed = conv.status === 'CLOSED'

  return (
    <button
      onClick={() => onClick(conv.id)}
      className="w-full text-left border border-slate-100 hover:border-yellow-300 hover:shadow-sm bg-white transition-all duration-200 p-4 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isClosed ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                <span className="material-symbols-outlined text-[11px] leading-none">lock</span>
                {t('messages.statusClosed')}
              </span>
            ) : isAwaitingReply ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                {t('messages.awaitingReply')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="material-symbols-outlined text-[11px] leading-none">check_circle</span>
                {t('messages.adminReplied')}
              </span>
            )}
          </div>
          <h3 className="font-headline font-bold text-sm text-slate-900 truncate group-hover:text-primary transition-colors">
            {conv.subject}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {conv.last_message_at && (
            <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
              {formatRelativeTime(conv.last_message_at, lang)}
            </span>
          )}
          <span className="material-symbols-outlined text-slate-300 group-hover:text-yellow-400 transition-colors text-lg">
            chevron_right
          </span>
        </div>
      </div>
    </button>
  )
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */

export default function MessagesPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language
  const { showError, showSuccess } = useNotification()

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [loadingMore, setLoadingMore] = useState(false)

  const loggedIn = isLoggedIn()

  const loadConversations = useCallback(async (page = 1, append = false) => {
    try {
      const res = await api.getMyConversations({ page, limit: 15 })
      if (append) {
        setConversations(prev => [...prev, ...res.conversations])
      } else {
        setConversations(res.conversations || [])
      }
      setPagination(res.pagination || { page: 1, totalPages: 1 })
    } catch (err) {
      showError(getApiErrorMessage(err, { t }))
    }
  }, [t, showError])

  useEffect(() => {
    if (!loggedIn) { setLoading(false); return }
    loadConversations(1).finally(() => setLoading(false))
  }, [loggedIn, loadConversations])

  const handleLoadMore = async () => {
    if (loadingMore || pagination.page >= pagination.totalPages) return
    setLoadingMore(true)
    await loadConversations(pagination.page + 1, true)
    setLoadingMore(false)
  }

  const handleConversationCreated = (conv) => {
    setShowModal(false)
    showSuccess(t('messages.conversationCreated'))
    navigate(`/messages/${conv.id}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header />

      <main className="flex-grow pt-32 pb-20 px-4 sm:px-8 md:px-16 max-w-screen-lg mx-auto w-full">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="mb-10 border-b border-slate-100 pb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary text-2xl">support_agent</span>
                <h1 className="text-3xl md:text-4xl font-headline font-black tracking-tighter text-primary uppercase">
                  {t('messages.title')}
                </h1>
              </div>
              <p className="text-sm text-slate-500 font-body max-w-xl">
                {t('messages.subtitle')}
              </p>
            </div>
            {loggedIn && (
              <button
                id="new-conversation-btn"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-headline font-bold uppercase text-xs tracking-widest hover:bg-primary/90 transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-base">add</span>
                {t('messages.newConversation')}
              </button>
            )}
          </div>
        </div>

        {/* ── Not Logged In ─────────────────────────────────────────────── */}
        {!loggedIn && (
          <div className="py-24 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 block mb-4">lock</span>
            <p className="font-headline font-bold uppercase tracking-widest text-sm text-slate-600 mb-2">
              {t('messages.loginRequired')}
            </p>
            <p className="text-xs text-slate-400 font-body">
              {t('messages.loginRequiredDesc')}
            </p>
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {loggedIn && loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-slate-100 bg-white p-4 animate-pulse">
                <div className="flex justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 bg-slate-100 rounded" />
                    <div className="h-4 w-2/3 bg-slate-100 rounded" />
                  </div>
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty State ────────────────────────────────────────────────── */}
        {loggedIn && !loading && conversations.length === 0 && (
          <div className="py-24 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 block mb-4"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>
              forum
            </span>
            <p className="font-headline font-bold uppercase tracking-widest text-sm text-slate-500 mb-2">
              {t('messages.noConversations')}
            </p>
            <p className="text-xs text-slate-400 font-body mb-8">
              {t('messages.noConversationsDesc')}
            </p>
            <button
              id="start-first-conversation-btn"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-headline font-bold uppercase text-xs tracking-widest hover:bg-primary/90 transition-all"
            >
              <span className="material-symbols-outlined text-base">add</span>
              {t('messages.startFirst')}
            </button>
          </div>
        )}

        {/* ── Conversation List ──────────────────────────────────────────── */}
        {loggedIn && !loading && conversations.length > 0 && (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                onClick={(id) => navigate(`/messages/${id}`)}
                t={t}
                lang={lang}
              />
            ))}

            {pagination.page < pagination.totalPages && (
              <div className="pt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-6 py-2.5 border border-slate-200 text-xs font-headline font-bold uppercase tracking-widest text-slate-600 hover:border-primary hover:text-primary transition-all disabled:opacity-50"
                >
                  {loadingMore ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-sm">expand_more</span>
                  )}
                  {t('messages.loadMore')}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />

      {showModal && (
        <NewConversationModal
          t={t}
          onClose={() => setShowModal(false)}
          onCreate={handleConversationCreated}
        />
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
