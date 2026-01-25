'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChatHeader from '@/components/ChatHeader';
import StudiesPanel from '@/components/StudiesPanel';
import LoadingOverlay from '@/components/LoadingOverlay';
import SettingsModal from '@/components/SettingsModal';

export default function StudiesPage() {
  const { status, isConnected, isInitialized } = useAuth();
  const [model, setModel] = useState('gpt4');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <main className="min-h-screen flex justify-center items-center p-5">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-[800px] h-[90vh] flex flex-col overflow-hidden relative">
        {!isInitialized && <LoadingOverlay message="Authenticating..." />}

        <ChatHeader
          status={status}
          isConnected={isConnected}
          model={model}
          onModelChange={setModel}
          activeTab="studies"
          onSettingsClick={() => setShowSettings(true)}
        />

        <StudiesPanel />

        {showSettings && (
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </main>
  );
}
