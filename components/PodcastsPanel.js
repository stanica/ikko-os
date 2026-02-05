'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Podcast, Plus } from 'lucide-react';
import PodcastItem from './PodcastItem';
import CreatePodcastModal from './CreatePodcastModal';
import PodcastPlayerModal from './PodcastPlayerModal';

const PODCASTS_STORAGE_KEY = 'ikko_podcasts';

// Load podcasts from localStorage
const loadPodcasts = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PODCASTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save podcasts to localStorage
const savePodcasts = (podcasts) => {
  try {
    localStorage.setItem(PODCASTS_STORAGE_KEY, JSON.stringify(podcasts));
  } catch (e) {
    console.error('Failed to save podcasts:', e);
  }
};

export default function PodcastsPanel() {
  const { authFetch } = useAuth();
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState(null);

  // Load podcasts from localStorage on mount
  useEffect(() => {
    const stored = loadPodcasts();
    setPodcasts(stored);
    setLoading(false);
  }, []);

  const viewPodcastDetails = (podcast) => {
    setSelectedPodcast(podcast);
    setShowPlayerModal(true);
  };

  const handleCreatePodcast = async (sources) => {
    setIsGenerating(true);
    setGenerationStatus('Generating podcast...');

    try {
      // Check if any sources are PDFs (File objects)
      const hasPdf = sources.some(s => s.type === 'pdf' && s.content instanceof File);

      let response;
      if (hasPdf) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('appId', 'AI-Podcast');

        for (const source of sources) {
          if (source.type === 'pdf' && source.content instanceof File) {
            formData.append('file', source.content, source.content.name);
          } else if (source.type === 'text') {
            formData.append('text', source.content);
          } else if (source.type === 'website') {
            formData.append('url', source.content);
          }
        }

        response = await authFetch('/api/podcasts/generate', {
          method: 'POST',
          body: formData,
          // Don't set Content-Type - browser will set it with boundary
        });
      } else {
        // Use JSON for text/URL only
        response = await authFetch('/api/podcasts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId: 'AI-Podcast',
            sources: sources,
          }),
        });
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Create podcast object from API response
        // API returns: wavName, speechTitle, speechSummarize, speechScript, requestId
        const newPodcast = {
          id: data.requestId || Date.now().toString(),
          sessionId: data.requestId,
          title: data.data.speechTitle || 'Untitled Podcast',
          summary: data.data.speechSummarize || '',
          audioUrl: data.data.wavName,
          script: data.data.speechScript,
          sourceCount: sources.length,
          createdAt: new Date().toISOString(),
        };

        // Add to local storage
        const updatedPodcasts = [newPodcast, ...podcasts];
        setPodcasts(updatedPodcasts);
        savePodcasts(updatedPodcasts);

        setGenerationStatus('Podcast created successfully!');
        setShowCreateModal(false);

        setTimeout(() => setGenerationStatus(null), 3000);
      } else {
        setGenerationStatus(`Error: ${data.msg || data.error || 'Failed to generate podcast'}`);
      }
    } catch (error) {
      console.error('Error creating podcast:', error);
      setGenerationStatus(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = () => {
    if (!selectedPodcast) return;

    if (!confirm('Are you sure you want to delete this podcast? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    // Remove from localStorage
    const updatedPodcasts = podcasts.filter(
      p => (p.id || p.sessionId) !== (selectedPodcast.id || selectedPodcast.sessionId)
    );
    setPodcasts(updatedPodcasts);
    savePodcasts(updatedPodcasts);

    setShowPlayerModal(false);
    setSelectedPodcast(null);
    setIsDeleting(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 bg-surface-secondary">
        {loading && podcasts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading podcasts...</div>
        ) : podcasts.length === 0 ? (
          <div className="text-center py-15 px-5 text-gray-500 dark:text-gray-400">
            <Podcast size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <div className="text-lg font-medium mb-2">No podcasts yet</div>
            <div className="text-sm">Create your first AI-generated podcast from text, PDFs, or websites!</div>
          </div>
        ) : (
          podcasts.map((podcast) => (
            <PodcastItem
              key={podcast.sessionId || podcast.id}
              podcast={podcast}
              onClick={() => viewPodcastDetails(podcast)}
            />
          ))
        )}

        {generationStatus && (
          <div className={`mt-4 py-3 px-4 rounded-xl text-sm animate-slide-in ${
            generationStatus.startsWith('Error')
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              : 'bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-300'
          }`}>
            {generationStatus}
          </div>
        )}
      </div>

      <div className="p-5 bg-surface border-t border-border">
        <button
          className="w-full py-3 border-none rounded-xl text-base font-semibold cursor-pointer transition-all bg-brand-500 text-white hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          onClick={() => setShowCreateModal(true)}
          disabled={isGenerating}
        >
          <Plus size={18} className="inline mr-1.5" />
          {isGenerating ? 'Generating...' : 'Create Podcast'}
        </button>
      </div>

      {showCreateModal && (
        <CreatePodcastModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePodcast}
          isGenerating={isGenerating}
        />
      )}

      {showPlayerModal && selectedPodcast && (
        <PodcastPlayerModal
          podcast={selectedPodcast}
          onClose={() => {
            setShowPlayerModal(false);
            setSelectedPodcast(null);
          }}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
