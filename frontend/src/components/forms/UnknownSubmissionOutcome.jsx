import { useTranslation } from 'react-i18next'

export default function UnknownSubmissionOutcome({ requestType }) {
  const { t } = useTranslation()

  const openMyRequests = () => {
    window.dispatchEvent(new CustomEvent('star-dewedar:open-my-requests', {
      detail: { requestType },
    }))
  }

  return (
    <div
      role="status"
      className="mb-5 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
    >
      <p className="font-bold">{t('notifications.submissionOutcomeUnknown')}</p>
      {requestType === 'contact' ? (
        <p className="mt-2 leading-relaxed">{t('notifications.submissionOutcomeContactNote')}</p>
      ) : (
        <p className="mt-2 leading-relaxed">{t('notifications.submissionOutcomeHistory')}</p>
      )}
      <button
        type="button"
        onClick={openMyRequests}
        className="mt-3 inline-flex items-center gap-2 border border-amber-800 px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-950 transition-colors hover:bg-amber-100"
      >
        <span className="material-symbols-outlined text-base">history</span>
        {t('myRequests.open')}
      </button>
    </div>
  )
}
