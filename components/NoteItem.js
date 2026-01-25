'use client';

import { Briefcase, Palette, BookOpen, MessageCircle } from 'lucide-react';

const categoryConfig = {
  work: { icon: Briefcase, color: '#3b82f6', bg: '#dbeafe', darkBg: '#1e3a5f' },
  creative: { icon: Palette, color: '#8b5cf6', bg: '#ede9fe', darkBg: '#3b2d5f' },
  learning: { icon: BookOpen, color: '#10b981', bg: '#d1fae5', darkBg: '#1a3d2e' },
  casual: { icon: MessageCircle, color: '#6b7280', bg: '#f3f4f6', darkBg: '#374151' },
};

export default function NoteItem({ note, onClick }) {
  const category = categoryConfig[note.taskType] || categoryConfig.casual;

  return (
    <div
      className="bg-surface-elevated p-4 rounded-xl mb-3 shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md border border-border"
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="font-semibold text-base text-text-primary flex items-center gap-2 flex-wrap">
          {note.sessionName}
          {note.taskType && (
            <span
              className="inline-flex items-center py-0.5 px-2 rounded-xl text-xs font-medium capitalize dark:text-gray-100"
              style={{ background: category.bg, color: category.color }}
            >
              <category.icon size={12} className="inline mr-1" /> {note.taskType}
            </span>
          )}
        </div>
        <div className="bg-gray-200 dark:bg-gray-700 text-text-muted py-1 px-2 rounded-md text-xs">
          {note.total || 0} {note.total === 1 ? 'item' : 'items'}
        </div>
      </div>
      <div className="text-text-muted text-sm">{note.lastTime}</div>
      {note.lastMessage && (
        <div className="text-text-muted text-sm mt-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {note.lastMessage}
        </div>
      )}
    </div>
  );
}
