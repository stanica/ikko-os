'use client';

import { useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, Check, X, PanelLeftClose, PanelLeft } from 'lucide-react';

export default function ChatSidebar({
  isOpen,
  onToggle,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (chat, e) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const saveEdit = (e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (chatId, e) => {
    e.stopPropagation();
    if (confirm('Delete this chat?')) {
      onDeleteChat(chatId);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Collapsed state - just show toggle button
  if (!isOpen) {
    return (
      <div className="w-12 bg-sidebar-bg flex flex-col items-center py-4 gap-3 border-r border-border">
        <button
          onClick={onToggle}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Open sidebar"
        >
          <PanelLeft size={20} />
        </button>
        <button
          onClick={onNewChat}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="New chat"
        >
          <Plus size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-sidebar-bg flex flex-col h-full border-r border-border">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-border">
        <button
          onClick={onNewChat}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-brand-500 hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all"
        >
          <Plus size={16} />
          New Chat
        </button>
        <button
          onClick={onToggle}
          className="ml-2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Close sidebar"
        >
          <PanelLeftClose size={20} />
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto py-2">
        {chats.length === 0 ? (
          <div className="px-3 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            No chats yet
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`group mx-2 mb-1 p-2.5 rounded-lg cursor-pointer transition-colors ${
                activeChatId === chat.id
                  ? 'bg-brand-100 dark:bg-gray-700 text-brand-800 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              {editingId === chat.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(e);
                      if (e.key === 'Escape') cancelEdit(e);
                    }}
                    className="flex-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-500 outline-none focus:border-brand-500"
                    autoFocus
                  />
                  <button
                    onClick={saveEdit}
                    className="p-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <MessageSquare size={16} className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{chat.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatDate(chat.updatedAt)}
                      </div>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={(e) => startEditing(chat, e)}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white rounded"
                        title="Rename"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(chat.id, e)}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
