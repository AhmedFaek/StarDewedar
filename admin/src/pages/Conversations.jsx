import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import * as convService from '../services/conversationService'

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

function formatDateTime(dateStr, lang) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/* ─── Product Picker Modal ────────────────────────────────────────────────── */

function AdminProductPicker({ t, lang, onSelect, onClose }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState(null)

  useEffect(() => {
    Promise.all([convService.getProducts(), convService.getCategories()])
      .then(([prods, cats]) => {
        setProducts(prods?.data || prods || [])
        setCategories(cats?.data || cats || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => {
    const name = lang === 'ar' ? p.name_ar : p.name_en
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !selectedCat || p.category_id === selectedCat
    return matchSearch && matchCat
  })

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-headline font-black text-primary text-sm uppercase tracking-tight">
              {t('conversations.shareProductTitle')}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{t('conversations.shareProductDesc')}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="px-6 py-3 border-b border-slate-100 space-y-2 shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('conversations.searchProducts')}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 focus:outline-none focus:border-primary transition-colors" />
          </div>
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setSelectedCat(null)}
                className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wider border transition-colors ${!selectedCat ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-500 hover:border-primary hover:text-primary'}`}>
                All
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCat(cat.id === selectedCat ? null : cat.id)}
                  className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wider border transition-colors ${selectedCat === cat.id ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-500 hover:border-primary hover:text-primary'}`}>
                  {lang === 'ar' ? cat.name_ar : cat.name_en}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="flex justify-center py-12"><span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block" /></div>}
          {!loading && filtered.length === 0 && <div className="py-12 text-center text-sm text-slate-400">{t('conversations.noProductsFound')}</div>}
          {!loading && filtered.map(product => {
            const name = lang === 'ar' ? product.name_ar : product.name_en
            const desc = lang === 'ar' ? product.description_ar : product.description_en
            const img = product.images?.[0]?.image_url
            return (
              <button key={product.id} onClick={() => onSelect(product)}
                className="w-full text-left flex items-center gap-4 px-6 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors group">
                <div className="w-12 h-12 bg-slate-100 shrink-0 overflow-hidden">
                  {img ? <img src={img} alt={name} className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-slate-300">image</span></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate group-hover:text-primary transition-colors">{name}</p>
                  {desc && <p className="text-[11px] text-slate-400 line-clamp-1">{desc}</p>}
                </div>
                <span className="shrink-0 px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-primary text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('conversations.selectProduct')}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Product Card ────────────────────────────────────────────────────────── */

function ProductCard({ product, t, lang }) {
  if (!product) return null
  const name = lang === 'ar' ? product.name_ar : product.name_en
  const desc = lang === 'ar' ? product.description_ar : product.description_en
  const img = product.images?.[0]?.image_url
  const catName = lang === 'ar' ? product.category?.name_ar : product.category?.name_en

  return (
    <div className="mt-2 border border-slate-200 bg-white overflow-hidden max-w-xs w-full">
      {img && <div className="aspect-[16/9] overflow-hidden bg-slate-100"><img src={img} alt={name} className="w-full h-full object-cover" /></div>}
      <div className="p-3">
        {catName && <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 mb-1">{catName}</p>}
        <p className="font-bold text-sm text-slate-900 truncate">{name}</p>
        {desc && <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{desc}</p>}
      </div>
    </div>
  )
}

/* ─── Message Bubble (admin view) ─────────────────────────────────────────── */

function AdminMessageBubble({ message, t, lang }) {
  const isAdmin = message.sender_type === 'ADMIN'
  const isSystem = message.sender_type === 'SYSTEM'
  const isProduct = message.message_type === 'PRODUCT'

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 text-[10px] text-slate-400 bg-slate-50 border border-slate-100 italic">
          {escapeHtml(message.content)}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col mb-4 ${isAdmin ? 'items-end' : 'items-start'}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 px-1">
        {isAdmin ? t('conversations.you') : t('conversations.customer')}
      </span>
      <div className={`px-4 py-3 max-w-sm shadow-sm ${isAdmin ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-900'}`}>
        {isProduct ? (
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${isAdmin ? 'text-white/70' : 'text-slate-400'}`}>
              {t('conversations.sharedProduct')}
            </p>
            <ProductCard product={message.product} t={t} lang={lang} />
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{escapeHtml(message.content)}</p>
        )}
      </div>
      <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">{formatDateTime(message.created_at, lang)}</span>
    </div>
  )
}

/* ─── Conversation Detail Panel ───────────────────────────────────────────── */

const CONV_POLL_INTERVAL = 30000

function ConversationDetail({ conversationId, t, lang, onBack, onStatusChange }) {
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [error, setError] = useState(null)

  const messagesEndRef = useRef(null)
  const pollRef = useRef(null)
  const lastMessageIdRef = useRef(null)

  const loadData = useCallback(async () => {
    try {
      const [convRes, msgRes] = await Promise.all([
        convService.getConversationById(conversationId),
        convService.getMessages(conversationId, { limit: 30 }),
      ])
      setConversation(convRes.data)
      const { messages: msgs, nextCursor: cursor, hasMore: more } = msgRes.data
      setMessages([...(msgs || [])].reverse())
      setNextCursor(cursor)
      setHasMore(more)
      if (msgs?.length) lastMessageIdRef.current = msgs[0]?.id
    } catch (err) {
      setError(err.message || 'Failed to load conversation')
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    setLoading(true)
    setMessages([])
    setReplyText('')
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!loading) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [loading])

  // Polling
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await convService.getMessages(conversationId, { limit: 30 })
        const { messages: msgs } = res.data
        const latestId = msgs?.[0]?.id
        if (latestId && latestId !== lastMessageIdRef.current) {
          lastMessageIdRef.current = latestId
          setMessages([...(msgs || [])].reverse())
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
      } catch { /* silently ignore */ }
    }, CONV_POLL_INTERVAL)
    return () => clearInterval(pollRef.current)
  }, [conversationId])

  const handleLoadOlder = async () => {
    if (!nextCursor || loadingOlder) return
    setLoadingOlder(true)
    try {
      const res = await convService.getMessages(conversationId, { limit: 30, cursor: nextCursor })
      const { messages: older, nextCursor: newCursor, hasMore: more } = res.data
      setMessages(prev => [...[...(older || [])].reverse(), ...prev])
      setNextCursor(newCursor)
      setHasMore(more)
    } catch { /* ignore */ } finally { setLoadingOlder(false) }
  }

  const handleSend = async () => {
    const trimmed = replyText.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      const res = await convService.sendAdminMessage(conversationId, { message_type: 'TEXT', content: trimmed })
      const newMsg = res.data
      setMessages(prev => [...prev, newMsg])
      lastMessageIdRef.current = newMsg.id
      setReplyText('')
      setConversation(prev => prev ? { ...prev, last_message_sender_type: 'ADMIN' } : prev)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      alert(err.message)
    } finally { setSending(false) }
  }

  const handleProductSelected = async (product) => {
    setShowProductPicker(false)
    try {
      const res = await convService.sendAdminMessage(conversationId, { message_type: 'PRODUCT', product_id: product.id })
      const newMsg = res.data
      setMessages(prev => [...prev, newMsg])
      lastMessageIdRef.current = newMsg.id
      setConversation(prev => prev ? { ...prev, last_message_sender_type: 'ADMIN' } : prev)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) { alert(err.message) }
  }

  const handleClose = async () => {
    setActionLoading(true)
    try {
      await convService.closeConversation(conversationId)
      setConversation(prev => prev ? { ...prev, status: 'CLOSED' } : prev)
      onStatusChange?.(conversationId, 'CLOSED')
    } catch (err) { alert(err.message) } finally { setActionLoading(false) }
  }

  const handleReopen = async () => {
    setActionLoading(true)
    try {
      await convService.reopenConversation(conversationId)
      setConversation(prev => prev ? { ...prev, status: 'OPEN' } : prev)
      onStatusChange?.(conversationId, 'OPEN')
    } catch (err) { alert(err.message) } finally { setActionLoading(false) }
  }

  const isClosed = conversation?.status === 'CLOSED'

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
        <button onClick={onBack} className="text-slate-400 hover:text-primary transition-colors p-1">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        {loading ? (
          <div className="flex-1 h-4 bg-slate-100 animate-pulse rounded" />
        ) : conversation ? (
          <>
            <div className="flex-1 min-w-0">
              <h2 className="font-headline font-black text-primary text-sm truncate">{conversation.subject}</h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] text-slate-400">{conversation.customer?.name}</span>
                <span className="text-[10px] text-slate-300">·</span>
                <span className="text-[10px] text-slate-400">{conversation.customer?.email}</span>
                {isClosed ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200">{t('conversations.statusClosed')}</span>
                ) : (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">{t('conversations.statusOpen')}</span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              {isClosed ? (
                <button onClick={handleReopen} disabled={actionLoading}
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition-colors disabled:opacity-50">
                  <span className="material-symbols-outlined text-[13px]">lock_open</span>
                  {t('conversations.reopenConversation')}
                </button>
              ) : (
                <button onClick={handleClose} disabled={actionLoading}
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50">
                  <span className="material-symbols-outlined text-[13px]">do_not_disturb</span>
                  {t('conversations.closeConversation')}
                </button>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4 min-h-0">
        {error && <div className="text-center py-8 text-sm text-red-600">{error}</div>}
        {loading && (
          <div className="flex justify-center py-16"><span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block" /></div>
        )}
        {!loading && (
          <>
            {hasMore && (
              <div className="text-center mb-4">
                <button onClick={handleLoadOlder} disabled={loadingOlder}
                  className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-primary border border-slate-200 px-4 py-1.5 transition-colors disabled:opacity-50">
                  {loadingOlder ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> : <span className="material-symbols-outlined text-sm">expand_less</span>}
                  {t('conversations.loadOlderMessages')}
                </button>
              </div>
            )}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">chat</span>
                <p className="text-sm text-slate-400">{t('conversations.noMessages')}</p>
              </div>
            )}
            {messages.map(msg => (
              <AdminMessageBubble key={msg.id} message={msg} t={t} lang={lang} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply box */}
      <div className="border-t border-slate-100 bg-white p-4 shrink-0">
        {isClosed && (
          <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-100 text-xs text-amber-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px] shrink-0">info</span>
            {t('conversations.closedBanner')}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              id="admin-reply-input"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSend() } }}
              maxLength={2000}
              rows={2}
              placeholder={isClosed ? t('conversations.closedBanner') : t('conversations.typeReply')}
              disabled={sending || isClosed}
              className="w-full border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none disabled:bg-slate-50 disabled:text-slate-400"
            />
            <span className="absolute bottom-2 right-2 text-[10px] text-slate-300 font-mono">{replyText.length}/2000</span>
          </div>
          <div className="flex flex-col gap-2">
            <button id="admin-share-product-btn" onClick={() => setShowProductPicker(true)} disabled={sending || isClosed}
              title={t('conversations.shareProduct')}
              className="p-2.5 border border-slate-200 text-slate-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-40">
              <span className="material-symbols-outlined text-[18px] leading-none">inventory_2</span>
            </button>
            <button id="admin-send-btn" onClick={handleSend} disabled={sending || !replyText.trim() || isClosed}
              className="px-4 py-2.5 bg-primary text-white font-bold uppercase text-[11px] tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
              {sending ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : <span className="material-symbols-outlined text-[16px] leading-none">send</span>}
            </button>
          </div>
        </div>
      </div>

      {showProductPicker && (
        <AdminProductPicker t={t} lang={lang} onSelect={handleProductSelected} onClose={() => setShowProductPicker(false)} />
      )}
    </div>
  )
}

/* ─── Conversation List Row ───────────────────────────────────────────────── */

function ConvListRow({ conv, isSelected, onClick, t, lang }) {
  const isAwaiting = conv.last_message_sender_type === 'CUSTOMER'
  const isClosed = conv.status === 'CLOSED'

  return (
    <button
      onClick={() => onClick(conv.id)}
      className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-all group ${
        isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-50 border-l-4 border-l-transparent'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs text-slate-900 truncate">{conv.customer?.name}</p>
          <p className="text-[11px] text-slate-400 truncate">{conv.subject}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {conv.last_message_at && (
            <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
              {formatRelativeTime(conv.last_message_at, lang)}
            </span>
          )}
          {isClosed ? (
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500">{t('conversations.statusClosed')}</span>
          ) : isAwaiting ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-red-50 text-red-600">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
              {t('conversations.awaitingReply')}
            </span>
          ) : (
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700">{t('conversations.adminReplied')}</span>
          )}
        </div>
      </div>
    </button>
  )
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

const LIST_POLL_INTERVAL = 30000

export default function AdminConversations() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('ALL') // ALL | OPEN | CLOSED | AWAITING
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const listPollRef = useRef(null)

  const buildParams = useCallback((page = 1) => {
    const params = { page, limit: 20 }
    if (filter === 'OPEN') params.status = 'OPEN'
    if (filter === 'CLOSED') params.status = 'CLOSED'
    if (search) params.search = search
    return params
  }, [filter, search])

  const loadList = useCallback(async (page = 1, silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await convService.getAllConversations(buildParams(page))
      let convs = res.conversations || []
      // Client-side filter for "AWAITING"
      if (filter === 'AWAITING') convs = convs.filter(c => c.last_message_sender_type === 'CUSTOMER' && c.status === 'OPEN')
      setConversations(convs)
      setPagination(res.pagination || { page: 1, totalPages: 1 })
    } catch (err) {
      console.error('Failed to load conversations', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [buildParams, filter])

  useEffect(() => { loadList(1) }, [loadList])

  // Polling for list updates
  useEffect(() => {
    listPollRef.current = setInterval(() => loadList(pagination.page, true), LIST_POLL_INTERVAL)
    return () => clearInterval(listPollRef.current)
  }, [loadList, pagination.page])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handleStatusChange = (id, newStatus) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
  }

  const filterLabels = [
    { key: 'ALL', label: t('conversations.filterAll') },
    { key: 'OPEN', label: t('conversations.filterOpen') },
    { key: 'CLOSED', label: t('conversations.filterClosed') },
    { key: 'AWAITING', label: t('conversations.filterAwaiting') },
  ]

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">

      {/* ── Sidebar: Conversation List ──────────────────────────────────── */}
      <div className={`flex flex-col border-r border-slate-100 bg-white shrink-0 ${selectedId ? 'hidden lg:flex w-72 xl:w-80' : 'w-full lg:w-72 xl:w-80'}`}>

        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-100 shrink-0">
          <h1 className="font-headline font-black text-primary text-base uppercase tracking-tight mb-1">
            {t('conversations.title')}
          </h1>
          <p className="text-[11px] text-slate-400">{t('conversations.subtitle')}</p>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-3 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              id="conversations-search"
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={t('conversations.search')}
              className="w-full pl-9 pr-10 py-2 text-xs border border-slate-200 focus:outline-none focus:border-primary transition-colors"
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(''); setSearch('') }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </form>

          {/* Filters */}
          <div className="mt-2 flex gap-1 flex-wrap">
            {filterLabels.map(f => (
              <button key={f.key} onClick={() => { setFilter(f.key); setSelectedId(null) }}
                className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                  filter === f.key ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-500 hover:border-primary hover:text-primary'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="space-y-px p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3 animate-pulse">
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 bg-slate-100 rounded" />
                      <div className="h-2.5 w-1/2 bg-slate-100 rounded" />
                    </div>
                    <div className="h-3 w-12 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <span className="material-symbols-outlined text-3xl text-slate-200 mb-2">forum</span>
              <p className="text-xs text-slate-400">{t('conversations.noConversationsDesc')}</p>
            </div>
          )}
          {!loading && conversations.map(conv => (
            <ConvListRow
              key={conv.id}
              conv={conv}
              isSelected={selectedId === conv.id}
              onClick={(id) => setSelectedId(id)}
              t={t}
              lang={lang}
            />
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-50 flex items-center justify-between">
              <button
                onClick={() => loadList(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">chevron_left</span>
              </button>
              <span className="text-[11px] text-slate-400 font-mono">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => loadList(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main: Conversation Detail ───────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 bg-white ${!selectedId ? 'hidden lg:flex' : 'flex'}`}>
        {selectedId ? (
          <ConversationDetail
            key={selectedId}
            conversationId={selectedId}
            t={t}
            lang={lang}
            onBack={() => setSelectedId(null)}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>
              support_agent
            </span>
            <p className="font-headline font-bold uppercase tracking-widest text-sm text-slate-400">
              {t('conversations.title')}
            </p>
            <p className="text-xs text-slate-300 mt-1 max-w-xs">
              Select a conversation from the list to view messages
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
