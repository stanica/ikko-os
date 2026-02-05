'use client';

import { Podcast, Play, Clock, FileText, Globe, Type } from 'lucide-react';

const sourceTypeIcons = {
  text: Type,
  pdf: FileText,
  website: Globe,
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (seconds) => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function PodcastItem({ podcast, onClick }) {
  const title = podcast.sessionName || podcast.title || 'Untitled Podcast';
  const sourceCount = podcast.sourceCount || podcast.sources?.length || 0;
  const duration = podcast.duration || podcast.audioDuration;
  const status = podcast.status || 'completed';
  const createdAt = podcast.createTime || podcast.createdAt;

  const isGenerating = status === 'generating' || status === 'pending' || status === 'processing';

  return (
    <div
      className={`mb-3 bg-surface-elevated rounded-xl p-4 shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md animate-slide-in ${
        isGenerating ? 'opacity-70' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isGenerating
            ? 'bg-yellow-100 dark:bg-yellow-900/30'
            : 'bg-brand-100 dark:bg-brand-900/30'
        }`}>
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Podcast size={24} className="text-brand-500 dark:text-brand-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">
            {title}
          </h3>

          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
            {sourceCount > 0 && (
              <span className="flex items-center gap-1">
                <FileText size={14} />
                {sourceCount} source{sourceCount !== 1 ? 's' : ''}
              </span>
            )}

            {duration && !isGenerating && (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {formatDuration(duration)}
              </span>
            )}

            {createdAt && (
              <span className="text-xs">
                {formatDate(createdAt)}
              </span>
            )}
          </div>

          {isGenerating && (
            <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 font-medium">
              Generating podcast...
            </div>
          )}
        </div>

        {!isGenerating && (
          <button
            className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Play size={18} className="ml-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}
