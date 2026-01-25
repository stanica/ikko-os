'use client';

import { useState } from 'react';
import { useConfig } from '@/context/ConfigContext';
import { Settings } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const { config, updateConfig, resetConfig } = useConfig();
  const [localConfig, setLocalConfig] = useState(config);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setLocalConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    Object.entries(localConfig).forEach(([key, value]) => {
      updateConfig(key, value);
    });
    onClose();
  };

  const handleReset = () => {
    resetConfig();
    setLocalConfig({
      deviceImei: '',
      deviceSn: '',
      userEmail: '',
      userPassword: '',
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[2000] p-5"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-[450px] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center py-5 px-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl text-gray-800 dark:text-gray-100 m-0 flex items-center gap-2 font-semibold"><Settings size={20} /> Settings</h2>
          <button
            className="bg-transparent border-none text-3xl text-gray-500 dark:text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">Device IMEI</label>
            <input
              type="text"
              value={localConfig.deviceImei}
              onChange={(e) => handleChange('deviceImei', e.target.value)}
              className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm outline-none transition-colors font-mono focus:border-brand-500 dark:focus:border-brand-400"
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">Device Serial Number</label>
            <input
              type="text"
              value={localConfig.deviceSn}
              onChange={(e) => handleChange('deviceSn', e.target.value)}
              className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm outline-none transition-colors font-mono focus:border-brand-500 dark:focus:border-brand-400"
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">Email</label>
            <input
              type="email"
              value={localConfig.userEmail}
              onChange={(e) => handleChange('userEmail', e.target.value)}
              className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm outline-none transition-colors font-mono focus:border-brand-500 dark:focus:border-brand-400"
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">Password</label>
            <input
              type="password"
              value={localConfig.userPassword}
              onChange={(e) => handleChange('userPassword', e.target.value)}
              className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm outline-none transition-colors font-mono focus:border-brand-500 dark:focus:border-brand-400"
            />
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 italic">
            Changes will take effect on next authentication.
          </p>
        </div>

        <div className="flex gap-3 py-4 px-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
          <button
            className="py-2.5 px-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-none rounded-lg text-sm font-semibold cursor-pointer transition-colors hover:bg-red-200 dark:hover:bg-red-900/50"
            onClick={handleReset}
          >
            Reset to Defaults
          </button>
          <button
            className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-none rounded-lg text-sm font-semibold cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2.5 px-4 bg-brand-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
