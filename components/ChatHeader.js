'use client';

import Link from 'next/link';
import { Settings, MessageSquare, FileText, Microscope, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const tabs = [
  { id: 'chat', label: 'Chat', href: '/', icon: MessageSquare },
  { id: 'notes', label: 'Notes', href: '/notes', icon: FileText },
  { id: 'studies', label: 'Studies', href: '/studies', icon: Microscope },
];

export default function ChatHeader({
  status,
  isConnected,
  model,
  onModelChange,
  activeTab,
  onSettingsClick,
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-header-bg text-white p-5 shadow-md relative z-10">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold m-0">Ikko OS</h1>
          <div className="flex items-center gap-2 text-xs mt-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected
                ? 'bg-green-400 animate-[pulse_2s_infinite]'
                : 'bg-red-500'
            }`} />
            <span>{status}</span>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex gap-2.5 items-center">
            <label className="text-sm font-medium">Model:</label>
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              className="py-2 px-3 rounded-lg border-none bg-white/20 dark:bg-gray-600 text-white text-sm cursor-pointer outline-none [&_option]:bg-brand-500 dark:[&_option]:bg-gray-600 [&_option]:text-white"
            >
              <option value="gpt4">GPT-4</option>
              <option value="gpt5">GPT-5</option>
              <option value="gemini-flash">Gemini</option>
            </select>
          </div>
          <button
            className="py-2 px-3 bg-white/20 dark:bg-gray-600 border-none rounded-lg text-base cursor-pointer transition-colors hover:bg-white/30 dark:hover:bg-gray-500"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="py-2 px-3 bg-white/20 dark:bg-gray-600 border-none rounded-lg text-base cursor-pointer transition-colors hover:bg-white/30 dark:hover:bg-gray-500"
            onClick={onSettingsClick}
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`py-2 px-4 bg-white/20 dark:bg-gray-600 border-none rounded-lg text-white no-underline text-sm font-medium transition-colors hover:bg-white/30 dark:hover:bg-gray-500 flex items-center ${
              activeTab === tab.id ? 'bg-white/40 dark:bg-brand-500 font-semibold' : ''
            }`}
          >
            <tab.icon size={16} className="mr-1.5" /> {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
