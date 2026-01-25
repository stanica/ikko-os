'use client';

import { useState, useEffect } from 'react';

function generateSessionId() {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

export default function CreateNoteModal({ editData, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('casual');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (editData) {
      setTitle(editData.sessionName || '');
      setType(editData.taskType || 'casual');
      setContent(editData.inputText || '');
    }
  }, [editData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) return;

    onSubmit({
      sessionId: editData?.sessionId || generateSessionId(),
      sessionName: title.trim(),
      taskType: type,
      modelType: 'gpt-4o',
      inputType: 'audio',
      inputText: content.trim(),
      outputText: '',
      fileUrl: null,
      tokenInput: 0,
      tokenOutput: 0,
      tokenTotal: 0,
      sensitiveWords: null,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[2000] p-5"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-[500px] max-h-[80vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center py-5 px-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl text-gray-800 dark:text-gray-100 m-0 font-semibold">{editData ? 'Edit Note' : 'Create New Note'}</h2>
          <button
            className="bg-transparent border-none text-3xl text-gray-500 dark:text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 mt-5">
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title"
              required
              className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-base font-inherit outline-none transition-colors focus:border-brand-500 dark:focus:border-brand-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          <div className="px-6 mt-5">
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-base font-inherit outline-none transition-colors focus:border-brand-500 dark:focus:border-brand-400"
            >
              <option value="casual">Casual</option>
              <option value="work">Work</option>
              <option value="creative">Creative</option>
              <option value="learning">Learning</option>
            </select>
          </div>
          <div className="px-6 mt-5">
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your note content"
              required
              className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-base font-inherit outline-none transition-colors resize-y min-h-30 focus:border-brand-500 dark:focus:border-brand-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-3 p-6">
            <button
              type="button"
              className="flex-1 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all bg-brand-500 text-white hover:-translate-y-0.5 hover:shadow-lg"
            >
              {editData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
