'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChatHeader from '@/components/ChatHeader';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import ChatSidebar from '@/components/ChatSidebar';
import TypingIndicator from '@/components/TypingIndicator';
import LoadingOverlay from '@/components/LoadingOverlay';
import SettingsModal from '@/components/SettingsModal';
import {
  loadChatHistory,
  createNewChat,
  updateChat,
  deleteChat,
  getChat,
  renameChat,
} from '@/lib/chat-history';

export default function Home() {
  const { sessionId, status, isConnected, isInitialized, authFetch } = useAuth();
  const [model, setModel] = useState('gpt4');
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  // Load chat history on mount
  useEffect(() => {
    const history = loadChatHistory();
    setChats(history);

    if (history.length > 0) {
      // Load most recent chat
      setActiveChatId(history[0].id);
      setMessages(history[0].messages);
      setConversationHistory(history[0].conversationHistory || []);
    } else {
      // Create first chat
      const newChat = createNewChat();
      setChats([newChat]);
      setActiveChatId(newChat.id);
      setMessages(newChat.messages);
      setConversationHistory([]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Save current chat when messages change
  const saveCurrentChat = useCallback((newMessages, newConversationHistory) => {
    if (activeChatId) {
      const updatedChat = updateChat(activeChatId, {
        messages: newMessages,
        conversationHistory: newConversationHistory,
      });
      if (updatedChat) {
        setChats(loadChatHistory());
      }
    }
  }, [activeChatId]);

  const handleNewChat = () => {
    const newChat = createNewChat();
    setChats(loadChatHistory());
    setActiveChatId(newChat.id);
    setMessages(newChat.messages);
    setConversationHistory([]);
  };

  const handleSelectChat = (chatId) => {
    if (chatId === activeChatId) return;

    const chat = getChat(chatId);
    if (chat) {
      setActiveChatId(chatId);
      setMessages(chat.messages);
      setConversationHistory(chat.conversationHistory || []);
    }
  };

  const handleDeleteChat = (chatId) => {
    const remainingChats = deleteChat(chatId);
    setChats(remainingChats);

    if (chatId === activeChatId) {
      if (remainingChats.length > 0) {
        setActiveChatId(remainingChats[0].id);
        setMessages(remainingChats[0].messages);
        setConversationHistory(remainingChats[0].conversationHistory || []);
      } else {
        // Create new chat if all deleted
        const newChat = createNewChat();
        setChats([newChat]);
        setActiveChatId(newChat.id);
        setMessages(newChat.messages);
        setConversationHistory([]);
      }
    }
  };

  const handleRenameChat = (chatId, newTitle) => {
    renameChat(chatId, newTitle);
    setChats(loadChatHistory());
  };

  // Send message using authFetch for automatic 401 handling
  const handleSend = async (text, images) => {
    if (isProcessing) return;

    // Build content array
    const content = [];
    if (text) {
      content.push({ type: 'text', text });
    }
    if (images.length > 0) {
      images.forEach((imgData) => {
        content.push({
          type: 'image_url',
          image_url: { url: imgData },
        });
      });
    }

    // Add user message
    const newMessages = [...messages, { role: 'user', content: text, images }];
    setMessages(newMessages);
    const newHistory = [...conversationHistory, { role: 'user', content }];
    setConversationHistory(newHistory);
    setIsProcessing(true);
    setIsTyping(true);

    // Save immediately with user message
    saveCurrentChat(newMessages, newHistory);

    try {
      // Use authFetch for automatic 401 handling
      const response = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messageList: newHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setIsTyping(false);

      // Parse SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let buffer = '';

      // Add empty assistant message
      let streamingMessages = [...newMessages, { role: 'assistant', content: '', images: [] }];
      setMessages(streamingMessages);

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
              streamingMessages = [
                ...newMessages,
                { role: 'assistant', content: assistantMessage, images: [] },
              ];
              setMessages(streamingMessages);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      // Final save with complete assistant message
      const finalMessages = [
        ...newMessages,
        { role: 'assistant', content: assistantMessage, images: [] },
      ];
      const finalHistory = [
        ...newHistory,
        { role: 'assistant', content: [{ type: 'text', text: assistantMessage }] },
      ];
      setMessages(finalMessages);
      setConversationHistory(finalHistory);
      saveCurrentChat(finalMessages, finalHistory);
    } catch (error) {
      setIsTyping(false);
      console.error('Send message error:', error);

      const errorMessages = [
        ...newMessages,
        { role: 'assistant', content: `Error: ${error.message}`, images: [] },
      ];
      setMessages(errorMessages);
      saveCurrentChat(errorMessages, newHistory);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen flex justify-center items-center p-5">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-[1100px] h-[90vh] flex overflow-hidden relative">
        {!isInitialized && <LoadingOverlay message="Authenticating..." />}

        <ChatSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader
            status={status}
            isConnected={isConnected}
            model={model}
            onModelChange={setModel}
            activeTab="chat"
            onSettingsClick={() => setShowSettings(true)}
          />

          <div className="flex-1 overflow-y-auto p-5 bg-surface-secondary">
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                role={msg.role}
                content={msg.content}
                images={msg.images}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
          <ChatInput onSend={handleSend} disabled={isProcessing || !sessionId} />
        </div>

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
