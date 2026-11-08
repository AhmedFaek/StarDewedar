import { useTranslation } from 'react-i18next'
import { getEmailSuggestion } from '../../utils/emailSuggestion.js'

export default function EmailSuggestion({ email, onSelect }) {
  const { t } = useTranslation()
  const suggestion = getEmailSuggestion(email)

  return (
    <div aria-live="polite" className={suggestion ? 'mt-1' : ''}>
      {suggestion && (
        <p className="text-start text-xs text-slate-600" dir="auto">
          {t('emailSuggestion.prompt')}{' '}
          <button
            type="button"
            onClick={() => onSelect(suggestion)}
            className="font-semibold text-primary underline underline-offset-2"
          >
            <bdi dir="ltr">{suggestion}</bdi>
          </button>
          {t('emailSuggestion.suffix')}
        </p>
      )}
    </div>
  )
}
