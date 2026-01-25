'use client';

import { FileText, Bot, Link, History, Pencil, Trash2 } from 'lucide-react';

export default function NoteDetailsModal({ title, records, onClose, onEdit, onDelete, isDeleting }) {
  const latestRecord = records[0];

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[2000] p-5"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center py-5 px-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl text-gray-800 dark:text-gray-100 m-0 font-semibold">{title}</h2>
          <button
            className="bg-transparent border-none text-3xl text-gray-500 dark:text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {!records || records.length === 0 ? (
            <div className="text-center py-10 px-5 text-gray-500 dark:text-gray-400">
              <FileText size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <div>No records in this note</div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-brand-500 text-sm">Latest Version</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">{latestRecord.createdAt}</span>
              </div>

              {latestRecord.inputText && (
                <div className="mb-3">
                  <div className="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-1.5 flex items-center gap-1.5"><FileText size={14} /> Content</div>
                  <div className="text-gray-800 dark:text-gray-100 text-sm leading-relaxed whitespace-pre-wrap">{latestRecord.inputText}</div>
                </div>
              )}

              {latestRecord.outputText && (
                <div className="mb-3">
                  <div className="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-1.5 flex items-center gap-1.5"><Bot size={14} /> AI Summary</div>
                  <div className="text-gray-800 dark:text-gray-100 text-sm leading-relaxed whitespace-pre-wrap">{latestRecord.outputText}</div>
                </div>
              )}

              {latestRecord.fileUrl && (
                <div className="mb-3">
                  <div className="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-1.5 flex items-center gap-1.5"><Link size={14} /> File</div>
                  <a
                    href={latestRecord.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 no-underline text-sm hover:underline"
                  >
                    View File
                  </a>
                </div>
              )}

              {records.length > 1 && (
                <div>
                  <div className="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-1.5 flex items-center gap-1.5"><History size={14} /> Version History</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">
                    {records.length} versions available (showing latest)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {latestRecord && (
          <div className="py-4 px-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex gap-3">
            <button
              className="flex-1 py-3 bg-brand-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onEdit(latestRecord)}
              disabled={isDeleting}
            >
              <Pencil size={16} className="inline mr-1.5" /> Edit
            </button>
            <button
              className="flex-1 py-3 bg-red-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onDelete}
              disabled={isDeleting}
            >
              <Trash2 size={16} className="inline mr-1.5" /> {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
