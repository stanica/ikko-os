'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Camera, Send } from 'lucide-react';

export default function StudiesPanel() {
  const { sessionId, authFetch } = useAuth();
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [subject, setSubject] = useState('Subject-General');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setError(null);
    setUploadedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to Ikko
    await uploadImage(file);
  };

  const uploadImage = async (file) => {
    if (!sessionId) {
      setError('Not authenticated. Please refresh the page.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('appId', 'AI-Studies');

      // Use authFetch for automatic 401 handling
      const response = await authFetch('/api/studies/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data) {
        // data.data is an object like {url: "..."}, extract the URL string
        const url = typeof data.data === 'string' ? data.data : data.data.url;
        setImageUrl(url);
        setMessages([
          {
            role: 'assistant',
            content: 'Image uploaded successfully! Ask me anything about what you see in this image.',
          },
        ]);
      } else if (data.success && data.url) {
        setImageUrl(data.url);
        setMessages([
          {
            role: 'assistant',
            content: 'Image uploaded successfully! Ask me anything about what you see in this image.',
          },
        ]);
      } else {
        throw new Error(data.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err.message}`);
      setImageUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isProcessing || !imageUrl) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);
    setError(null);

    try {
      // Build messages array for the API
      const apiMessages = [
        {
          text: userMessage,
          role: 'user',
          image_url: imageUrl,
        },
      ];

      const response = await authFetch('/api/studies/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: subject,
          appId: 'AI-Studies',
          language: 'English',
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Parse SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let buffer = '';

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const events = buffer.split('data:');
        buffer = events.pop() || '';

        for (const event of events) {
          if (!event.trim()) continue;

          const data = event.trim();
          if (data === '[DONE]') continue;

          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content;

            if (content) {
              assistantMessage += content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantMessage,
                };
                return updated;
              });
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      // If no content was received, show error
      if (!assistantMessage) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'No response received from the API.',
          };
          return updated;
        });
      }
    } catch (err) {
      console.error('Recognition error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}` },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImageUrl(null);
    setImagePreview(null);
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-surface-secondary">
      {!imagePreview ? (
        <div
          className={`flex-1 flex flex-col items-center justify-center p-10 m-5 border-3 border-dashed rounded-2xl cursor-pointer transition-all bg-brand-50 dark:bg-brand-500/10 hover:border-brand-500 hover:bg-brand-100 dark:hover:bg-brand-500/20 hover:scale-[1.01] ${
            dragActive ? 'border-brand-500 bg-brand-200 dark:bg-brand-500/30 scale-[1.02] shadow-xl' : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <Camera size={72} className="mb-5 text-gray-400 dark:text-gray-500 animate-float" />
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Upload an Image</h3>
          <p className="text-base text-gray-500 dark:text-gray-400 mb-3">
            Drag and drop an image here, or click to select
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Supports: JPG, PNG, GIF, WebP
          </p>
        </div>
      ) : (
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
          <div className="relative shrink-0 p-4 bg-surface border-b border-border">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Subject:</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="py-2 px-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 cursor-pointer outline-none transition-all hover:border-brand-500 focus:border-brand-500 dark:focus:border-brand-400 focus:shadow-sm"
                >
                  <option value="Subject-">Auto</option>
                  <option value="Subject-General">General</option>
                  <option value="Subject-Physics">Physics</option>
                  <option value="Subject-Chemistry">Chemistry</option>
                  <option value="Subject-Mathematics">Mathematics</option>
                  <option value="Subject-History">History</option>
                  <option value="Subject-Geography">Geography</option>
                </select>
              </div>
              <button
                className="py-2 px-3.5 bg-red-500/90 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-red-600 hover:scale-105"
                onClick={clearImage}
                title="Clear image"
              >
                ✕ Clear
              </button>
            </div>
            <div className="relative flex justify-center items-center max-h-50 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
              <img src={imagePreview} alt="Uploaded" className="max-w-full max-h-50 object-contain rounded-xl" />
              {isUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 rounded-xl text-white font-medium">
                  <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`max-w-[85%] animate-slide-in ${
                    msg.role === 'user' ? 'self-end' : 'self-start'
                  }`}
                >
                  <div className={`py-3 px-4 rounded-2xl text-base leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-brand-500 text-white rounded-br-sm'
                      : 'bg-surface-elevated text-text-primary rounded-bl-sm shadow-md'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="max-w-[85%] self-start animate-slide-in">
                  <div className="flex gap-1 p-4">
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce-dot [animation-delay:-0.32s]"></span>
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce-dot [animation-delay:-0.16s]"></span>
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce-dot"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-3 p-4 bg-surface border-t border-border shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={imageUrl ? "Ask about this image..." : "Upload an image first..."}
                disabled={!imageUrl || isProcessing}
                className="flex-1 py-3.5 px-4.5 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-3xl text-base outline-none transition-all focus:border-brand-500 dark:focus:border-brand-400 focus:shadow-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || !imageUrl || isProcessing}
                className="w-12 h-12 border-none rounded-full bg-brand-500 text-white text-lg cursor-pointer transition-all flex items-center justify-center hover:not-disabled:scale-110 hover:not-disabled:shadow-lg disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {isProcessing ? '...' : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-4 my-3 py-3 px-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-xl text-sm animate-slide-in">
          {error}
        </div>
      )}
    </div>
  );
}
