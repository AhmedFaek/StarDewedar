// ─── contactMessages.jsx ─────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components'
import { Pagination } from '../components/ui/Pagination'
import { formatDate } from '../utils/helpers'
import { getAllMessages } from '../services/contactService'

export default function ContactMessagesPage() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMsg, setSelectedMsg] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true)
        const data = await getAllMessages()
        setMessages(data || [])
      } catch (error) {
        console.error('Failed to load messages:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [])

  const itemsPerPage = 4
  const totalPages = Math.ceil(messages.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = messages.slice(startIdx, startIdx + itemsPerPage)

  return (
    <div className="max-w-full relative">
      <div className="mb-8 sm:mb-10 lg:mb-12">
        <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">{t('inbox.subtitle')}</span>
        <h2 className="text-3xl font-black font-headline tracking-tighter text-primary leading-none sm:text-4xl lg:text-5xl">{t('inbox.title')}<span className="text-tertiary">.</span></h2>
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-variant">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">{t('inbox.table.sender')}</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">{t('inbox.table.preview')}</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">{t('inbox.table.received')}</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary text-right">{t('inbox.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {loading ? (
                <tr><td colSpan="4" className="p-10 text-center text-secondary font-bold">{t('common.loading')}</td></tr>
              ) : messages.length === 0 ? (
                <tr><td colSpan="4" className="p-10 text-center text-secondary font-bold">{t('inbox.no_messages')}</td></tr>
              ) : (
                displayedData.map((msg) => (
                  <tr key={msg.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-8 py-6">
                      <span className="block font-bold text-primary">{msg.first_name} {msg.last_name}</span>
                      <span className="text-xs font-mono text-slate-400">{msg.email}</span>
                    </td>
                    <td className="px-8 py-6 max-w-md"><p className="text-sm text-secondary truncate">{msg.message}</p></td>
                    <td className="px-8 py-6 text-sm text-secondary font-medium">{msg.created_at ? formatDate(msg.created_at) : '—'}</td>
                    <td className="px-8 py-6 text-right">
                      <button onClick={() => setSelectedMsg(msg)} className="bg-primary text-white p-2 rounded hover:bg-tertiary transition-colors">
                        <span className="material-symbols-outlined text-base">mail</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalDisplayed={displayedData.length} totalItems={messages.length} variant="table" />
      </div>

      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto border border-surface-variant bg-surface-container-lowest shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-variant bg-surface-container-low px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
              <div>
                <h3 className="text-xl font-black font-headline tracking-tighter text-primary uppercase">{t('inbox.modal.title')}</h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{t('inbox.modal.received')}: {selectedMsg.created_at ? formatDate(selectedMsg.created_at) : '—'}</p>
              </div>
              <button onClick={() => setSelectedMsg(null)} className="text-secondary hover:text-primary"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 gap-4 border-b border-surface-variant pb-6 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">{t('inbox.modal.from_label')}</label>
                  <p className="font-bold text-primary">{selectedMsg.first_name} {selectedMsg.last_name}</p>
                  <p className="text-sm text-secondary">{selectedMsg.email}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">{t('inbox.modal.lines_label')}</label>
                  <p className="text-xs text-primary font-bold uppercase">{t('inbox.modal.phone')}: {selectedMsg.phone_number || t('inbox.modal.na')}</p>
                  <p className="text-xs text-primary font-bold uppercase">{t('inbox.modal.whatsapp')}: {selectedMsg.whatsapp_number || t('inbox.modal.na')}</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">{t('inbox.modal.body_label')}</label>
                <div className="bg-surface-container-low p-6 border border-surface-variant text-sm text-secondary leading-relaxed italic">"{selectedMsg.message}"</div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a href={`mailto:${selectedMsg.email}`} className="flex-1 bg-primary text-white py-3 text-center text-xs font-black uppercase tracking-widest hover:bg-tertiary transition-colors">{t('inbox.modal.reply_email')}</a>
                {selectedMsg.whatsapp_number && (
                  <a href={`https://wa.me/${selectedMsg.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 border border-green-600 text-green-600 py-3 text-center text-xs font-black uppercase tracking-widest hover:bg-green-50 transition-colors">{t('inbox.modal.reply_whatsapp')}</a>
                )}
              </div>
            </div>
            <div className="bg-surface-container-low px-4 py-4 text-right sm:px-6 lg:px-8">
              <Button variant="secondary" onClick={() => setSelectedMsg(null)} className="w-full sm:w-auto">{t('inbox.modal.close')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
