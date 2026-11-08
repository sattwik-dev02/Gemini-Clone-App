import { useEffect, useRef, useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";
import { sendMessage } from "./services/geminiService";
import { streamMessage } from "./services/geminiService";
import { getChats, saveChat, deleteChat as deleteChatAPI } from "./services/chatService";

const STORAGE_KEY = "gemini-clone-chats";

function loadChats() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(
    window.innerWidth >= 768
  );
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");

  const abortControllerRef = useRef(null);

  const activeChat = chats.find(
    (chat) => chat.id === activeChatId
  );

  const messages = activeChat?.messages || [];

  useEffect(() => {
    let cancelled = false;

    async function loadChatHistory() {
      try {
        let savedChats = await getChats();

        // Import old localStorage conversations
        // only when MongoDB has no saved chats.
        if (savedChats.length === 0) {
          const oldChats = loadChats();

          if (oldChats.length > 0) {
            await Promise.all(
              oldChats.map((chat) =>
                saveChat({
                  id: chat.id,
                  title: chat.title || "Untitled Chat",

                  messages: (chat.messages || []).map(
                    (message) => ({
                      id: message.id || crypto.randomUUID(),
                      role: message.role,
                      text: message.text || "",
                      createdAt:
                        message.createdAt ||
                        new Date().toISOString(),
                    })
                  ),
                })
              )
            );

            // Retrieve migrated conversations
            savedChats = await getChats();
          }
        }

        if (!cancelled) {
          setChats(savedChats);
        }

      } catch (err) {
        if (!cancelled) {
          setError(
            "Unable to load chat history: " + err.message
          );

          // Display old local history as a fallback
          setChats(loadChats());
        }

      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    loadChatHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleNewChat() {
    if (loading) return;

    setActiveChatId(null);
    setError("");
  }

  async function handleDeleteChat(id) {
    if (loading) return;

    try {
      await deleteChatAPI(id);

      setChats((previous) =>
        previous.filter((chat) => chat.id !== id)
      );

      if (activeChatId === id) {
        setActiveChatId(null);
      }

      setError("");
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function handleSend(text) {
    if (loading || !text.trim()) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError("");

    const chatId = activeChatId || crypto.randomUUID();

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };

    const aiMessage = {
      id: crypto.randomUUID(),
      role: "model",
      text: "",
      createdAt: new Date().toISOString(),
    };

    const title =
      activeChat?.title || text.trim().slice(0, 35);

    const updatedMessages = [
      ...messages,
      userMessage,
      aiMessage,
    ];

    setActiveChatId(chatId);

    // Create a new chat or update the existing chat
    setChats((previous) => {
      const exists = previous.some(
        (chat) => chat.id === chatId
      );

      const newChat = {
        id: chatId,
        title,
        messages: updatedMessages,
      };

      return [
        newChat,
        ...previous.filter((chat) => chat.id !== chatId),
      ];
    });

    // Keep a local copy of the generated response
    let assistantText = "";

    try {
      // Send only recent context to Gemini.
      // Keeping the complete conversation in MongoDB.
      const apiMessages = buildRecentContext([
        ...messages,
        userMessage,
      ]).map(({ role, text }) => ({
        role,
        text,
      }));

      await streamMessage(
        apiMessages,

        // Receive and display each streamed chunk
        (chunk) => {
          assistantText += chunk;

          setChats((previous) =>
            previous.map((chat) =>
              chat.id === chatId
                ? {
                  ...chat,
                  messages: chat.messages.map((message) =>
                    message.id === aiMessage.id
                      ? {
                        ...message,
                        text: message.text + chunk,
                      }
                      : message
                  ),
                }
                : chat
            )
          );
        },

        // Allow Stop generation
        controller.signal
      );

    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }

    } finally {
      // Prepare complete messages for database storage
      const finalMessages = [
        ...messages,
        userMessage,
      ];

      // Save the AI response if any text was generated
      if (assistantText) {
        finalMessages.push({
          ...aiMessage,
          text: assistantText,
        });
      }

      const chatToSave = {
        id: chatId,
        title,
        messages: finalMessages,
      };

      // Update the UI with the final conversation
      setChats((previous) => [
        chatToSave,
        ...previous.filter((chat) => chat.id !== chatId),
      ]);

      try {
        // Save the chat to MongoDB
        const savedChat = await saveChat(chatToSave);

        // Get the database timestamps
        setChats((previous) =>
          previous.map((chat) =>
            chat.id === savedChat.id
              ? savedChat
              : chat
          )
        );

      } catch (saveError) {
        setError(
          "Could not save chat history: " +
          saveError.message
        );
      }

      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }

      setLoading(false);
    }
  }

  function buildRecentContext(messages, maxTurns = 8) {
    const turns = [];

    for (const message of messages) {
      if (message.role === "user") {
        turns.push([message]);
      } else if (
        message.role === "model" &&
        turns.length > 0
      ) {
        turns[turns.length - 1].push(message);
      }
    }

    return turns.slice(-maxTurns).flat();
  }

  function handleStop() {
    abortControllerRef.current?.abort();
  }

  return (
    <div className="flex h-dvh overflow-hidden
      bg-[#131314] text-white"
    >
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={(id) => {
          if (loading) return;
          setActiveChatId(id);
          setError("");
          if (window.innerWidth < 768) {
            setSidebarOpen(false);
          }
        }}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0
          items-center gap-4 px-5"
        >
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="rounded-lg p-2
              hover:bg-white/10"
            >
              <Menu size={22} />
            </button>
          )}

          <div className="flex items-center gap-2">
            <Sparkles
              size={23}
              className="text-blue-400"
            />
            <h1 className="text-xl font-medium
              text-gray-200">
              Gemini Clone
            </h1>
          </div>
        </header>

        <section className="min-h-0 flex-1
          overflow-y-auto px-5"
        >
          <ChatWindow
            messages={messages}
            loading={loading}
            onSuggestion={handleSend}
          />
        </section>

        <div className="shrink-0 px-4 pb-4 pt-3">
          {error && (
            <div className="mx-auto mb-3 max-w-3xl
              rounded-lg bg-red-500/10 p-3
              text-sm text-red-300"
              role="alert"
            >
              {error}
            </div>
          )}

          <ChatInput
            onSend={handleSend}
            onStop={handleStop}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}