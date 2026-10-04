import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { usePrivatePageSeo } from '../hooks/usePrivatePageSeo'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { api } from '../utils/api'
import { getUser, isLoggedIn } from '../utils/auth'
import { getApiErrorMessage } from '../utils/apiErrorHandler'
import { useNotification } from '../hooks/useNotification'

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatTime(dateStr, lang) {
  const date = new Date(dateStr)
  return date.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/* ─── Product Picker Modal ────────────────────────────────────────────────── */

function ProductPickerModal({ t, lang, onSelect, onClose }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)

  useEffect(() => {
    Promise.all([api.getProducts(), api.getCategories()])
      .then(([prods, cats]) => {
        setProducts(prods?.data || prods || [])
        setCategories(cats?.data || cats || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter((p) => {
    const name = lang === 'ar' ? p.name_ar : p.name_en
    const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase())
    const matchesCat = !selectedCategory || p.category_id === selectedCategory
    return matchesSearch && matchesCat
  })

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-headline font-black text-primary text-base uppercase tracking-tight">
              {t('messages.shareProductTitle')}
            </h3>
            <p className="text-xs text-slate-400 font-body mt-0.5">
              {t('messages.shareProductDesc')}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Search + Category filter */}
        <div className="px-6 py-3 border-b border-slate-100 space-y-2 shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
            <input
              id="product-picker-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('messages.searchProducts')}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 focus:outline-none focus:border-primary transition-colors font-body"
            />
          </div>
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 text-[11px] font-headline font-bold uppercase tracking-widest border transition-colors ${
                  !selectedCategory
                    ? 'bg-primary text-white border-primary'
                    : 'border-slate-200 text-slate-500 hover:border-primary hover:text-primary'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                  className={`px-3 py-1 text-[11px] font-headline font-bold uppercase tracking-widest border transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-white border-primary'
                      : 'border-slate-200 text-slate-500 hover:border-primary hover:text-primary'
                  }`}
                >
                  {lang === 'ar' ? cat.name_ar : cat.name_en}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <span className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-200 block mb-3">inventory_2</span>
              <p className="text-sm text-slate-400 font-body">{t('messages.noProductsFound')}</p>
            </div>
          )}
          {!loading && filtered.map((product) => {
            const name = lang === 'ar' ? product.name_ar : product.name_en
            const desc = lang === 'ar' ? product.description_ar : product.description_en
            const img = product.images?.[0]?.image_url
            return (
              <button
                key={product.id}
                onClick={() => onSelect(product)}
                className="w-full text-left flex items-center gap-4 px-6 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors group"
              >
                <div className="w-14 h-14 bg-slate-100 shrink-0 overflow-hidden">
                  {img ? (
                    <img src={img} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-300">image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-headline font-bold text-sm text-slate-900 truncate group-hover:text-primary transition-colors">
                    {name}
                  </p>
                  {desc && (
                    <p className="text-[11px] text-slate-400 line-clamp-1 font-body">{desc}</p>
                  )}
                </div>
                <span className="shrink-0 px-3 py-1 text-[10px] font-headline font-bold uppercase tracking-widest bg-primary text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('messages.selectProduct')}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Product Message Card ────────────────────────────────────────────────── */

function ProductCard({ product, t, lang, navigate }) {
  if (!product) return null
  const name = lang === 'ar' ? product.name_ar : product.name_en
  const desc = lang === 'ar' ? product.description_ar : product.description_en
  const img = product.images?.[0]?.image_url
  const catName = lang === 'ar' ? product.category?.name_ar : product.category?.name_en

  return (
    <div className="mt-2 border border-slate-200 bg-white overflow-hidden max-w-xs w-full">
      {img && (
        <div className="aspect-[16/9] overflow-hidden bg-slate-100">
          <img src={img} alt={name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3">
        {catName && (
          <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-yellow-600 mb-1">
            {catName}
          </p>
        )}
        <p className="font-headline font-bold text-sm text-slate-900 truncate">{name}</p>
        {desc && <p className="text-[11px] text-slate-500 font-body line-clamp-2 mt-1">{desc}</p>}
        <button
          onClick={() => navigate(`/product-detail?id=${product.id}`)}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-headline font-bold uppercase tracking-widest text-primary hover:text-yellow-600 transition-colors"
        >
          {t('messages.viewProduct')}
          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}

/* ─── Message Bubble ──────────────────────────────────────────────────────── */

function MessageBubble({ message, currentUserId, t, lang, navigate }) {
  const isCustomer = message.sender_type === 'CUSTOMER'
  const isSystem = message.sender_type === 'SYSTEM'
  const isOwn = isCustomer && message.sender_id === currentUserId
  const isProduct = message.message_type === 'PRODUCT'

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 text-[10px] font-body text-slate-400 bg-slate-50 border border-slate-100 italic">
          {escapeHtml(message.content)}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col mb-4 ${isOwn ? 'items-end' : 'items-start'}`}>
      {/* Sender label */}
      <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-400 mb-1 px-1">
        {isOwn ? t('messages.you') : t('messages.support')}
      </span>

      {/* Bubble */}
      <div
        className={`px-4 py-3 max-w-sm shadow-sm ${
          isOwn
            ? 'bg-primary text-white'
            : 'bg-white border border-slate-200 text-slate-900'
        }`}
      >
        {isProduct ? (
          <div>
            <p className={`text-[11px] font-headline font-bold uppercase tracking-widest mb-2 ${isOwn ? 'text-white/70' : 'text-slate-400'}`}>
              {t('messages.sharedProduct')}
            </p>
            <ProductCard product={message.product} t={t} lang={lang} navigate={navigate} />
          </div>
        ) : (
          <p className="text-sm font-body leading-relaxed whitespace-pre-wrap break-words">
            {escapeHtml(message.content)}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <span className={`text-[10px] text-slate-400 mt-1 px-1 font-mono`}>
        {formatTime(message.created_at, lang)}
      </span>
    </div>
  )
}

/* ─── Message Input Bar ───────────────────────────────────────────────────── */

function MessageInputBar({ conversationId, isClosed, t, onMessageSent, onShowProductPicker }) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef(null)
  const { showError } = useNotification()

  const handleSend = async () => {
    const trimmed = content.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      const res = await api.sendConversationMessage(conversationId, {
        message_type: 'TEXT',
        content: trimmed,
      })
      setContent('')
      onMessageSent(res.data)
    } catch (err) {
      showError(getApiErrorMessage(err, {}))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-slate-100 bg-white p-4">
      {isClosed && (
        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-100 text-xs font-body text-amber-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-[15px] shrink-0">info</span>
          {t('messages.reopenPrompt')}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            id="message-input"
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={2000}
            rows={2}
            placeholder={t('messages.typeMessage')}
            disabled={sending}
            className="w-full border border-slate-200 px-3 py-2.5 text-sm font-body text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
          />
          <span className="absolute bottom-2 right-2 text-[10px] text-slate-300 font-mono">
            {content.length}/2000
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <button
            id="share-product-btn"
            onClick={onShowProductPicker}
            disabled={sending}
            title={t('messages.shareProduct')}
            className="p-2.5 border border-slate-200 text-slate-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">inventory_2</span>
          </button>
          <button
            id="send-message-btn"
            onClick={handleSend}
            disabled={sending || !content.trim()}
            className="px-4 py-2.5 bg-primary text-white font-headline font-bold uppercase text-[11px] tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {sending ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[16px] leading-none">send</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */

const POLL_INTERVAL = 5000 // 5 seconds for responsive sync with admin

export default function ConversationPage() {
  usePrivatePageSeo({ en: 'Conversation', ar: 'المحادثة' })
  const { id: conversationId } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language
  const { showSuccess, showError } = useNotification()

  const currentUser = getUser()
  const loggedIn = isLoggedIn()

  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingConv, setLoadingConv] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const messagesEndRef = useRef(null)
  const pollRef = useRef(null)
  const lastMessageIdRef = useRef(null)

  // ── Load conversation ────────────────────────────────────────────────────
  const loadConversation = useCallback(async () => {
    try {
      const res = await api.getConversationById(conversationId)
      setConversation(res.data)
    } catch (err) {
      if (err?.status === 404) navigate('/messages')
    }
  }, [conversationId, navigate])

  // ── Load initial messages ────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    try {
      const res = await api.getConversationMessages(conversationId, { limit: 30 })
      const { messages: msgs, conversation: backendConv, nextCursor: cursor, hasMore: more } = res.data
      if (backendConv) {
        setConversation(prev => prev ? { ...prev, ...backendConv } : backendConv)
      }
      // API returns newest-first; reverse for display (oldest at top)
      setMessages([...(msgs || [])].reverse())
      setNextCursor(cursor)
      setHasMore(more)
      if (msgs?.length) lastMessageIdRef.current = msgs[0]?.id // newest
    } catch (err) {
      showError(getApiErrorMessage(err, { t }))
    }
  }, [conversationId, t, showError])

  useEffect(() => {
    if (!loggedIn) return
    Promise.all([loadConversation(), loadMessages()]).finally(() => {
      setLoadingConv(false)
      setLoadingMessages(false)
    })
  }, [loggedIn, loadConversation, loadMessages])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loadingMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [loadingMessages])

  // ── Polling for new messages & status updates ────────────────────────────
  useEffect(() => {
    if (!loggedIn) return

    const poll = async () => {
      try {
        const res = await api.getConversationMessages(conversationId, { limit: 30 })
        const { messages: msgs, conversation: backendConv } = res.data

        if (backendConv) {
          setConversation(prev => {
            if (!prev) return backendConv
            if (prev.status !== backendConv.status || prev.last_message_at !== backendConv.last_message_at) {
              return { ...prev, ...backendConv }
            }
            return prev
          })
        }

        const latestId = msgs?.[0]?.id
        if (latestId && latestId !== lastMessageIdRef.current) {
          lastMessageIdRef.current = latestId
          setMessages(prev => {
            const pageIds = new Set((msgs || []).map(m => m.id))
            const olderThanPage = prev.filter(m => !pageIds.has(m.id))
            return [...olderThanPage, ...[...(msgs || [])].reverse()]
          })
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
      } catch { /* silently ignore poll errors */ }
    }

    pollRef.current = setInterval(poll, POLL_INTERVAL)

    const handleFocus = () => {
      poll()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(pollRef.current)
      window.removeEventListener('focus', handleFocus)
    }
  }, [loggedIn, conversationId])

  // ── Load older messages (cursor-based) ──────────────────────────────────
  const handleLoadOlder = async () => {
    if (!nextCursor || loadingOlder) return
    setLoadingOlder(true)
    try {
      const res = await api.getConversationMessages(conversationId, {
        limit: 30,
        cursor: nextCursor,
      })
      const { messages: older, nextCursor: newCursor, hasMore: more } = res.data
      // Prepend older messages (they come newest-first from API, so reverse)
      setMessages(prev => [...[...(older || [])].reverse(), ...prev])
      setNextCursor(newCursor)
      setHasMore(more)
    } catch (err) {
      showError(getApiErrorMessage(err, { t }))
    } finally {
      setLoadingOlder(false)
    }
  }

  // ── Send message handler ─────────────────────────────────────────────────
  const handleMessageSent = (newMessage) => {
    setMessages(prev => [...prev, newMessage])
    lastMessageIdRef.current = newMessage.id
    // Optimistically update conversation status
    setConversation(prev => prev ? {
      ...prev,
      status: 'OPEN',
      last_message_at: newMessage.created_at,
      last_message_sender_type: 'CUSTOMER',
    } : prev)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  // ── Share product handler ─────────────────────────────────────────────────
  const handleProductSelected = async (product) => {
    setShowProductPicker(false)
    try {
      const res = await api.sendConversationMessage(conversationId, {
        message_type: 'PRODUCT',
        product_id: product.id,
      })
      handleMessageSent(res.data)
    } catch (err) {
      showError(getApiErrorMessage(err, { t }))
    }
  }

  // ── Close / Reopen ───────────────────────────────────────────────────────
  const handleClose = async () => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      await api.closeConversation(conversationId)
      setConversation(prev => prev ? { ...prev, status: 'CLOSED' } : prev)
      showSuccess(t('messages.conversationClosed'))
    } catch (err) {
      showError(getApiErrorMessage(err, { t }))
    } finally {
      setActionLoading(false)
    }
  }

  const handleReopen = async () => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      await api.reopenConversation(conversationId)
      setConversation(prev => prev ? { ...prev, status: 'OPEN' } : prev)
      showSuccess(t('messages.conversationReopened'))
    } catch (err) {
      showError(getApiErrorMessage(err, { t }))
    } finally {
      setActionLoading(false)
    }
  }

  const isClosed = conversation?.status === 'CLOSED'

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header />

      <main className="flex-grow pt-28 pb-0 flex flex-col max-w-screen-lg mx-auto w-full px-4 sm:px-8 md:px-16">

        {/* ── Not logged in ─────────────────────────────────────────────── */}
        {!loggedIn && (
          <div className="flex-grow flex items-center justify-center py-24">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl text-slate-300 block mb-4">lock</span>
              <p className="font-headline font-bold uppercase tracking-widest text-sm text-slate-600">
                {t('messages.loginRequired')}
              </p>
            </div>
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {loggedIn && loadingConv && (
          <div className="flex-grow flex items-center justify-center py-24">
            <span className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Conversation Thread ───────────────────────────────────────── */}
        {loggedIn && !loadingConv && conversation && (
          <div className="flex flex-col flex-grow min-h-0 pb-6">

            {/* Header row */}
            <div className="flex items-center gap-3 mb-4 py-4 border-b border-slate-100">
              <button
                id="back-to-messages-btn"
                onClick={() => navigate('/messages')}
                className="text-slate-400 hover:text-primary transition-colors"
                title={t('messages.backToMessages')}
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="font-headline font-black text-primary text-base md:text-lg uppercase tracking-tight truncate">
                  {conversation.subject}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  {isClosed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                      <span className="material-symbols-outlined text-[11px] leading-none">lock</span>
                      {t('messages.statusClosed')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      {t('messages.statusOpen')}
                    </span>
                  )}
                  <p className="text-[10px] text-slate-400 font-body">{t('messages.subtitle')}</p>
                </div>
              </div>
              {/* Actions */}
              <div className="shrink-0 flex gap-2">
                {isClosed ? (
                  <button
                    id="reopen-conversation-btn"
                    onClick={handleReopen}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-3 py-1.5 border border-emerald-200 text-emerald-700 text-[11px] font-headline font-bold uppercase tracking-widest hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[13px]">lock_open</span>
                    {t('messages.reopen')}
                  </button>
                ) : (
                  <button
                    id="close-conversation-btn"
                    onClick={handleClose}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-500 text-[11px] font-headline font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[13px]">do_not_disturb</span>
                    {t('messages.close')}
                  </button>
                )}
              </div>
            </div>

            {/* Closed banner */}
            {isClosed && (
              <div className="mb-4 px-4 py-3 bg-slate-50 border border-slate-200 flex items-center gap-2 text-sm text-slate-600 font-body">
                <span className="material-symbols-outlined text-slate-400 text-[18px]">lock</span>
                <span>
                  <strong>{t('messages.closedBanner')}</strong>{' '}
                  {t('messages.reopenPrompt')}
                </span>
              </div>
            )}

            {/* Messages area */}
            <div className="flex-grow overflow-y-auto bg-slate-50/50 border border-slate-100 p-4 mb-0 min-h-64">
              {/* Load older */}
              {hasMore && (
                <div className="text-center mb-4">
                  <button
                    onClick={handleLoadOlder}
                    disabled={loadingOlder}
                    className="inline-flex items-center gap-2 text-[11px] font-headline font-bold uppercase tracking-widest text-slate-500 hover:text-primary border border-slate-200 px-4 py-1.5 transition-colors disabled:opacity-50"
                  >
                    {loadingOlder ? (
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                    ) : (
                      <span className="material-symbols-outlined text-sm">expand_less</span>
                    )}
                    {t('messages.loadOlderMessages')}
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!loadingMessages && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-200 block mb-2">chat</span>
                  <p className="text-sm text-slate-400 font-body">{t('messages.noMessages')}</p>
                </div>
              )}

              {/* Loading messages */}
              {loadingMessages && (
                <div className="flex items-center justify-center h-40">
                  <span className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Message bubbles */}
              {!loadingMessages && messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  currentUserId={currentUser?.id}
                  t={t}
                  lang={lang}
                  navigate={navigate}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <MessageInputBar
              conversationId={conversationId}
              isClosed={isClosed}
              t={t}
              onMessageSent={handleMessageSent}
              onShowProductPicker={() => setShowProductPicker(true)}
            />
          </div>
        )}
      </main>

      <Footer />

      {showProductPicker && (
        <ProductPickerModal
          t={t}
          lang={lang}
          onSelect={handleProductSelected}
          onClose={() => setShowProductPicker(false)}
        />
      )}
    </div>
  )
}
