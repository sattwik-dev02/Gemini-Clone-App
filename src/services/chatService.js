const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

async function chatRequest(path, options = {}) {
  const response = await fetch(
    `${API_URL}/api/chats${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || `HTTP error: ${response.status}`
    );
  }

  return data;
}

// Fetch all chat history
export async function getChats() {
  return chatRequest("");
}

// Save a new chat or update an existing chat
export async function saveChat(chat) {
  return chatRequest(`/${encodeURIComponent(chat.id)}`, {
    method: "PUT",
    body: JSON.stringify({
      title: chat.title,
      messages: chat.messages,
    }),
  });
}

// Delete a chat
export async function deleteChat(chatId) {
  return chatRequest(`/${encodeURIComponent(chatId)}`, {
    method: "DELETE",
  });
}