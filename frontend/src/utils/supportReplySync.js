export const CONVERSATION_SEEN_EVENT = 'star-dewedar:conversation-seen'

/**
 * Tell SupportReplyNotice that a conversation's messages were successfully retrieved
 * (the backend has marked the newest returned ADMIN message as seen before responding).
 * `messages` is the API page, newest first.
 */
export const notifyConversationSeen = (conversationId, messages) => {
  const latestAdmin = (messages || []).find((m) => m.sender_type === 'ADMIN')
  if (!latestAdmin) return
  window.dispatchEvent(new CustomEvent(CONVERSATION_SEEN_EVENT, {
    detail: { id: conversationId, seenUpTo: latestAdmin.created_at },
  }))
}