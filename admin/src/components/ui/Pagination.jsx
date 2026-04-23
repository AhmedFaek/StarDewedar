import { useTranslation } from 'react-i18next'

export const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalDisplayed,
  totalItems,
  variant = 'table',
  className = ''
}) => {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const isTableVariant = variant === 'table'

  const containerClasses = isTableVariant
    ? 'bg-primary px-4 py-4 text-white sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8'
    : 'flex gap-1'

  return (
    <div className={`${containerClasses} ${className}`}>

      {/* Info Text */}
      {isTableVariant && totalDisplayed !== undefined && totalItems !== undefined && (
        <p className={`text-xs font-bold font-headline opacity-60 ${
          isAr ? '' : 'uppercase tracking-widest'
        }`}>
          {t('pagination.displaying', { totalDisplayed, totalItems })}
        </p>
      )}

      <div className={isTableVariant ? 'mt-3 flex flex-wrap items-center justify-end gap-1 sm:mt-0' : 'flex gap-1'}>
        
        {/* Previous */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`w-${isTableVariant ? '10' : '8'} h-${isTableVariant ? '10' : '8'} flex items-center justify-center ${
            isTableVariant
              ? 'bg-white bg-opacity-10 hover:bg-tertiary hover:text-primary transition-all disabled:opacity-50'
              : 'border border-outline-variant border-opacity-30 text-secondary hover:bg-white transition-colors disabled:opacity-50'
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {isAr ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>

        {/* Pages */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-${isTableVariant ? '10' : '8'} h-${isTableVariant ? '10' : '8'} flex items-center justify-center font-bold text-xs font-headline ${
              currentPage === page
                ? isTableVariant
                  ? 'bg-tertiary-fixed text-primary'
                  : 'border border-primary bg-primary text-white'
                : isTableVariant
                ? 'bg-white bg-opacity-10 hover:bg-tertiary hover:text-primary transition-all'
                : 'border border-outline-variant border-opacity-30 text-secondary hover:bg-white transition-colors'
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`w-${isTableVariant ? '10' : '8'} h-${isTableVariant ? '10' : '8'} flex items-center justify-center ${
            isTableVariant
              ? 'bg-white bg-opacity-10 hover:bg-tertiary hover:text-primary transition-all disabled:opacity-50'
              : 'border border-outline-variant border-opacity-30 text-secondary hover:bg-white transition-colors disabled:opacity-50'
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {isAr ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>

      </div>
    </div>
  )
}
