import { useState } from 'react'
import { Button } from '../components'
import { Pagination } from '../components/ui/Pagination'
import { contactMessages as mockMessages } from '../data/mockData'

export default function ContactMessagesPage() {
  const [messages] = useState(mockMessages)
  const [selectedMsg, setSelectedMsg] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  // --- PAGINATION LOGIC ---
  const itemsPerPage = 4
  const totalPages = Math.ceil(messages.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = messages.slice(startIdx, startIdx + itemsPerPage)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  return (
    <div className="max-w-full relative">
      <div className="mb-12">
        <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">Customer Support</span>
        <h2 className="text-5xl font-black font-headline tracking-tighter text-primary leading-none">INBOX<span className="text-tertiary">.</span></h2>
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-variant">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">Sender</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">Message Preview</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">Received</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {displayedData.map((msg) => (
                <tr key={msg.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="px-8 py-6">
                    <span className="block font-bold text-primary">{msg.first_name} {msg.last_name}</span>
                    <span className="text-xs font-mono text-slate-400">{msg.email}</span>
                  </td>
                  <td className="px-8 py-6 max-w-md">
                    <p className="text-sm text-secondary truncate">{msg.message}</p>
                  </td>
                  <td className="px-8 py-6 text-sm text-secondary font-medium">
                    {formatDate(msg.created_at)}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedMsg(msg)}
                      className="bg-primary text-white p-2 rounded hover:bg-tertiary transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">mail</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalDisplayed={displayedData.length}
          totalItems={messages.length}
          variant="table"
        />
      </div>

      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border border-surface-variant w-full max-w-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="px-8 py-6 bg-surface-container-low border-b border-surface-variant flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black font-headline tracking-tighter text-primary uppercase">Message Detail</h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Received: {formatDate(selectedMsg.created_at)}</p>
              </div>
              <button onClick={() => setSelectedMsg(null)} className="text-secondary hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4 pb-6 border-b border-surface-variant">
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">From</label>
                  <p className="font-bold text-primary">{selectedMsg.first_name} {selectedMsg.last_name}</p>
                  <p className="text-sm text-secondary">{selectedMsg.email}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">Direct Lines</label>
                  <p className="text-xs text-primary font-bold uppercase">Phone: {selectedMsg.phone_number || 'N/A'}</p>
                  <p className="text-xs text-primary font-bold uppercase">WhatsApp: {selectedMsg.whatsapp_number || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Message Body</label>
                <div className="bg-surface-container-low p-6 border border-surface-variant rounded text-sm text-secondary leading-relaxed italic">
                  "{selectedMsg.message}"
                </div>
              </div>

              <div className="flex gap-3">
                <a 
                  href={`mailto:${selectedMsg.email}`}
                  className="flex-1 bg-primary text-white py-3 text-center text-xs font-black uppercase tracking-widest hover:bg-tertiary transition-colors"
                >
                  Reply via Email
                </a>
                {selectedMsg.whatsapp_number && (
                  <a 
                    href={`https://wa.me/${selectedMsg.whatsapp_number.replace(/\D/g,'')}`}
                    target="_blank"
                    className="flex-1 border border-green-600 text-green-600 py-3 text-center text-xs font-black uppercase tracking-widest hover:bg-green-50 transition-colors"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </div>

            <div className="px-8 py-4 bg-surface-container-low text-right">
              <Button variant="secondary" onClick={() => setSelectedMsg(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}