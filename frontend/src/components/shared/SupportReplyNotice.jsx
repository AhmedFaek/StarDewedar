import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCompare } from '../../utils/compareContext'
import { resolveUiLanguage } from '../../utils/language'
import { api } from '../../utils/api'
import { getUser, isLoggedIn } from '../../utils/auth'
import { CONVERSATION_SEEN_EVENT } from '../../utils/supportReplySync'

const AUTH_CHANGED_EVENT = 'star-dewedar:auth-changed'
const POLL_INTERVAL = 30000 // 30 seconds

// Keep in sync with SupportMessagesFloat / CompareDrawer
const DRAWER_HEIGHT = 72

const getSessionKey = () => (isLoggedIn() ? String(getUser()?.id || 'user') : null)

const sameReplies = (a, b) =>
  a.length === b.length &&
  a.every((r, i) => r.id === b[i].id && r.last_message_at === b[i].last_message_at && r.subject === b[i].subject)

export default function SupportReplyNotice() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const { compareList } = useCompare()

  // Single source of truth for the notice
  const [replies, setReplies] = useState([])
  const [sessionKey, setSessionKey] = useState(getSessionKey)

  const inFlightRef = useRef(false)
  const generationRef = useRef(0) // bumped whenever in-flight responses become stale
  const seenUpToRef = useRef(new Map()) // conversationId -> newest admin reply the customer has been served

  const isRTL = resolveUiLanguage(i18n.language) === 'ar'
  const onMessagesPage = location.pathname.startsWith('/messages')
  const onMessagesPageRef = useRef(onMessagesPage)
  onMessagesPageRef.current = onMessagesPage
  const bottomOffset = compareList.length > 0 ? DRAWER_HEIGHT + 16 : 28

  // Drop replies the customer has already been served (guards against a response
  // that raced with the conversation's mark-seen).
  const filterSeen = useCallback((list) => list.filter((r) => {
    const seenUpTo = seenUpToRef.current.get(r.id)
    return !(seenUpTo && new Date(seenUpTo).getTime() >= new Date(r.last_message_at).getTime())
  }), [])

  const fetchReplies = useCallback(async () => {
    if (inFlightRef.current) return // never overlap requests
    inFlightRef.current = true
    const generation = generationRef.current
    let stale = false
    try {
      const res = await api.getUnseenConversationReplies()
      if (generation !== generationRef.current) {
        stale = true
        return
      }
      const next = filterSeen(Array.isArray(res?.data) ? res.data : [])
      setReplies((prev) => (sameReplies(prev, next) ? prev : next))
    } catch {
      // Expected for admins (403) or expired sessions (401): stay silent.
      // authFetch clears auth on 401, which stops polling via the session key.
      if (!getSessionKey()) setSessionKey(null)
    } finally {
      inFlightRef.current = false
      // Response was discarded as stale: re-check once with fresh state (e.g. after leaving /messages)
      if (stale && !onMessagesPageRef.current && getSessionKey()) fetchReplies()
    }
  }, [filterSeen])

  // Session changes (login/logout, dispatched by Header) - no-op when the user is unchanged
  useEffect(() => {
    const sync = () => setSessionKey(getSessionKey())
    window.addEventListener(AUTH_CHANGED_EVENT, sync)
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync)
  }, [])

  // Reset everything when the session changes
  useEffect(() => {
    generationRef.current += 1
    seenUpToRef.current = new Map()
    setReplies((prev) => (prev.length ? [] : prev))
  }, [sessionKey])

  // A conversation's messages were retrieved: remove its notice immediately
  useEffect(() => {
    const handleSeen = (event) => {
      const { id, seenUpTo } = event.detail || {}
      if (!id || !seenUpTo) return
      const known = seenUpToRef.current.get(id)
      if (!known || new Date(seenUpTo) > new Date(known)) seenUpToRef.current.set(id, seenUpTo)
      generationRef.current += 1 // any response requested before this point is stale
      setReplies((prev) => {
        const next = filterSeen(prev)
        return next.length === prev.length ? prev : next
      })
    }
    window.addEventListener(CONVERSATION_SEEN_EVENT, handleSeen)
    return () => window.removeEventListener(CONVERSATION_SEEN_EVENT, handleSeen)
  }, [filterSeen])

  // Poll every 30s while authenticated and outside the messages pages.
  // Entering /messages* stops polling; leaving it checks again immediately.
  useEffect(() => {
    if (!sessionKey) return undefined
    if (onMessagesPage) {
      generationRef.current += 1 // discard anything still in flight
      setReplies((prev) => (prev.length ? [] : prev))
      return undefined
    }

    fetchReplies()
    const timer = setInterval(fetchReplies, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [sessionKey, onMessagesPage, fetchReplies])

  if (!sessionKey || onMessagesPage || replies.length === 0) return null

  const single = replies.length === 1 ? replies[0] : null
  const to = single ? `/messages/${single.id}` : '/messages'
  const subject = single?.subject ? String(single.subject) : ''

  return (
    <div
      className={`fixed z-[198] pointer-events-none transition-[bottom] duration-300 ease-out
        ${isRTL ? 'right-4 sm:right-7' : 'left-4 sm:left-7'}`}
      style={{ bottom: `${bottomOffset}px` }}
    >
      <Link
        to={to}
        id="support-reply-notice"
        role="status"
        aria-live="polite"
        aria-label={t('messages.replyNotice.ariaLabel')}
        className="pointer-events-auto flex items-center gap-2.5 w-[260px] max-w-[calc(100vw-96px)] bg-white rounded-xl px-3 py-2 no-underline shadow-[0_10px_30px_rgba(0,14,36,0.16)] border border-slate-100 hover:shadow-[0_14px_34px_rgba(0,14,36,0.22)] hover:border-slate-200 transition-all duration-300 animate-bubble-pop-in group"
      >
        <span className="relative w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
          <span
            className="material-symbols-outlined text-[16px] leading-none"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
            aria-hidden="true"
          >
            support_agent
          </span>
          <span className="absolute -top-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white ltr:-right-0.5 rtl:-left-0.5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[11px] rtl:text-[11.5px] font-headline font-bold text-slate-900 leading-snug">
            {single
              ? t('messages.replyNotice.single')
              : t('messages.replyNotice.multiple', { n: replies.length })}
          </span>
          {subject && (
            <span dir="auto" className="block text-[10px] text-slate-500 font-body leading-tight truncate">
              {subject}
            </span>
          )}
        </span>

        <span
          className="material-symbols-outlined text-[16px] leading-none text-primary shrink-0 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
          aria-hidden="true"
        >
          {isRTL ? 'arrow_back' : 'arrow_forward'}
        </span>
      </Link>
    </div>
  )
}