'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const defaultConfig = {
  deviceImei: '',
  deviceSn: '',
  userEmail: '',
  userPassword: '',
};

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(defaultConfig);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ikko_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig({ ...defaultConfig, ...parsed });
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save config to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('ikko_config', JSON.stringify(config));
    }
  }, [config, isLoaded]);

  const updateConfig = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    localStorage.removeItem('ikko_config');
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig, resetConfig, isLoaded }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
