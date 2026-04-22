export const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalDisplayed,
  totalItems,
  variant = 'table', // 'table' or 'compact'
  className = ''
}) => {
  const isTableVariant = variant === 'table'

  const containerClasses = isTableVariant
    ? 'px-8 py-6 bg-primary flex justify-between items-center text-white'
    : 'flex gap-1'

  return (
    <div className={`${containerClasses} ${className}`}>
      {isTableVariant && totalDisplayed !== undefined && totalItems !== undefined && (
        <p className="text-xs font-bold font-headline uppercase tracking-widest opacity-60">
          Displaying {totalDisplayed} of {totalItems} entries
        </p>
      )}

      <div className={isTableVariant ? 'flex items-center gap-1' : 'flex gap-1'}>
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`w-${isTableVariant ? '10' : '8'} h-${isTableVariant ? '10' : '8'} flex items-center justify-center ${
            isTableVariant
              ? 'bg-white bg-opacity-10 hover:bg-tertiary hover:text-primary transition-all disabled:opacity-50'
              : 'border border-outline-variant border-opacity-30 text-secondary hover:bg-white transition-colors disabled:opacity-50'
          }`}
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>

        {/* Page Numbers */}
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

        {/* Next Button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`w-${isTableVariant ? '10' : '8'} h-${isTableVariant ? '10' : '8'} flex items-center justify-center ${
            isTableVariant
              ? 'bg-white bg-opacity-10 hover:bg-tertiary hover:text-primary transition-all disabled:opacity-50'
              : 'border border-outline-variant border-opacity-30 text-secondary hover:bg-white transition-colors disabled:opacity-50'
          }`}
        >
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  )
}
