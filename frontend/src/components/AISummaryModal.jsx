import { useEffect } from 'react';

export default function AISummaryModal({ isOpen, onClose, summaryData }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Severity badge colors
  const severityColors = {
    Low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const getSeverityClass = (sev) => severityColors[sev] || severityColors.Medium;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">
              AI Failure Analysis
            </h3>
            {summaryData?.severity && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getSeverityClass(summaryData.severity)}`}>
                {summaryData.severity}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto">
          {!summaryData ? (
            <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
              Generating...
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Summary Section */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2">
                  What went wrong
                </h4>
                <div className="rounded-xl bg-surface-50 dark:bg-surface-800/50 p-4 border border-surface-100 dark:border-surface-700/50">
                  <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                    {summaryData.summary}
                  </p>
                </div>
              </div>

              {/* Fixes Section */}
              {summaryData.suggested_fix && summaryData.suggested_fix.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2">
                    Suggested Fixes
                  </h4>
                  <ul className="space-y-2">
                    {summaryData.suggested_fix.map((fix, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-surface-700 dark:text-surface-300">
                        <span className="text-accent-500 mt-0.5">•</span>
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-surface-100 dark:border-surface-800 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-surface-100 dark:bg-surface-800 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
