const CHAT_HISTORY_KEY = "ikko_chat_history";

export const generateChatId = () => {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const loadChatHistory = () => {
  if (typeof window === "undefined") return [];
  try {
    const history = localStorage.getItem(CHAT_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
};

export const saveChatHistory = (history) => {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save chat history:", e);
  }
};

export const createNewChat = () => {
  const history = loadChatHistory();
  const newChat = {
    id: generateChatId(),
    title: "New Chat",
    messages: [
      {
        role: "assistant",
        content: "Hello! I'm your iKKO AI assistant. How can I help you today?",
        images: [],
      },
    ],
    conversationHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  history.unshift(newChat);
  saveChatHistory(history);
  return newChat;
};

export const updateChat = (chatId, updates) => {
  const history = loadChatHistory();
  const index = history.findIndex((chat) => chat.id === chatId);

  if (index !== -1) {
    history[index] = {
      ...history[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Auto-generate title from first user message if still "New Chat"
    if (history[index].title === "New Chat" && updates.messages) {
      const firstUserMessage = updates.messages.find((m) => m.role === "user");
      if (firstUserMessage) {
        history[index].title =
          firstUserMessage.content.slice(0, 40) +
          (firstUserMessage.content.length > 40 ? "..." : "");
      }
    }

    // Move to top of list
    const [chat] = history.splice(index, 1);
    history.unshift(chat);

    saveChatHistory(history);
    return history[0];
  }
  return null;
};

export const deleteChat = (chatId) => {
  const history = loadChatHistory();
  const filtered = history.filter((chat) => chat.id !== chatId);
  saveChatHistory(filtered);
  return filtered;
};

export const getChat = (chatId) => {
  const history = loadChatHistory();
  return history.find((chat) => chat.id === chatId) || null;
};

export const renameChat = (chatId, newTitle) => {
  return updateChat(chatId, { title: newTitle });
};
