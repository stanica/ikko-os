'use client';

import { useState, useRef } from 'react';
import { X, Plus, Type, FileText, Globe, Trash2, Upload } from 'lucide-react';

const SOURCE_TYPES = [
  { id: 'text', label: 'Text', icon: Type, description: 'Paste or type text' },
  { id: 'pdf', label: 'PDF', icon: FileText, description: 'Upload a PDF file' },
  { id: 'website', label: 'Website', icon: Globe, description: 'Enter a URL' },
];

export default function CreatePodcastModal({ onClose, onSubmit, isGenerating }) {
  const [sources, setSources] = useState([]);
  const [showAddSource, setShowAddSource] = useState(true);
  const [activeSourceType, setActiveSourceType] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const addSource = () => {
    setError(null);

    if (activeSourceType === 'text') {
      if (!textInput.trim()) {
        setError('Please enter some text');
        return;
      }
      setSources([...sources, { type: 'text', content: textInput.trim(), preview: textInput.trim().slice(0, 100) }]);
      setTextInput('');
    } else if (activeSourceType === 'website') {
      if (!urlInput.trim()) {
        setError('Please enter a URL');
        return;
      }
      // Basic URL validation
      try {
        new URL(urlInput.trim());
      } catch {
        setError('Please enter a valid URL (e.g., https://example.com)');
        return;
      }
      setSources([...sources, { type: 'website', content: urlInput.trim(), preview: urlInput.trim() }]);
      setUrlInput('');
    } else if (activeSourceType === 'pdf') {
      if (!selectedFile) {
        setError('Please select a PDF file');
        return;
      }
      setSources([...sources, { type: 'pdf', content: selectedFile, preview: selectedFile.name }]);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    setActiveSourceType(null);
    setShowAddSource(true);
  };

  const removeSource = (index) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = () => {
    if (sources.length === 0) {
      setError('Please add at least one source');
      return;
    }
    onSubmit(sources);
  };

  const getSourceIcon = (type) => {
    const sourceType = SOURCE_TYPES.find(s => s.id === type);
    return sourceType ? sourceType.icon : FileText;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create Podcast</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Added Sources */}
          {sources.length > 0 && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sources ({sources.length})
              </label>
              <div className="space-y-2">
                {sources.map((source, index) => {
                  const Icon = getSourceIcon(source.type);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                        <Icon size={16} className="text-brand-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {source.type}
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-200 truncate">
                          {source.preview}
                        </div>
                      </div>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        onClick={() => removeSource(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Source Section */}
          {showAddSource && !activeSourceType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Add Source
              </label>
              <div className="grid grid-cols-3 gap-3">
                {SOURCE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    className="group flex flex-col items-center gap-2 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:border-brand-500 hover:bg-brand-100 dark:hover:bg-brand-500/20 hover:scale-[1.02] transition-all"
                    onClick={() => setActiveSourceType(type.id)}
                  >
                    <type.icon size={24} className="text-gray-500 dark:text-gray-400 group-hover:text-brand-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text Input */}
          {activeSourceType === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paste or type text
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter the text content you want to convert into a podcast..."
                className="w-full h-40 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 resize-none focus:border-brand-500 focus:outline-none transition-colors"
              />
              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => {
                    setActiveSourceType(null);
                    setTextInput('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2.5 px-4 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
                  onClick={addSource}
                >
                  Add Text
                </button>
              </div>
            </div>
          )}

          {/* URL Input */}
          {activeSourceType === 'website' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:border-brand-500 focus:outline-none transition-colors"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                The visible text on the website will be extracted. Paid articles are not supported.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => {
                    setActiveSourceType(null);
                    setUrlInput('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2.5 px-4 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
                  onClick={addSource}
                >
                  Add URL
                </button>
              </div>
            </div>
          )}

          {/* PDF Input */}
          {activeSourceType === 'pdf' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload PDF
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center cursor-pointer hover:border-brand-500 hover:bg-brand-100 dark:hover:bg-brand-500/20 hover:scale-[1.01] transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText size={24} className="text-brand-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {selectedFile.name}
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Click to select a PDF file
                    </p>
                  </>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => {
                    setActiveSourceType(null);
                    setSelectedFile(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2.5 px-4 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
                  onClick={addSource}
                >
                  Add PDF
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 py-3 px-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          {sources.length > 0 && !activeSourceType && (
            <button
              className="py-2.5 px-4 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
              onClick={() => setActiveSourceType(null)}
            >
              <Plus size={16} /> Add More
            </button>
          )}
          <button
            className="flex-1 py-3 bg-brand-500 text-white rounded-xl text-base font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={sources.length === 0 || isGenerating}
          >
            {isGenerating ? 'Generating...' : `Generate Podcast (${sources.length} source${sources.length !== 1 ? 's' : ''})`}
          </button>
        </div>
      </div>
    </div>
  );
}
