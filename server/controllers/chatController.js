import Chat from "../models/chatSchema.js";

// Format MongoDB documents for the React frontend
function formatChat(chat) {
  return {
    id: chat.chatId,
    title: chat.title,
    messages: chat.messages,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  };
}

// Validate messages before saving
function areMessagesValid(messages) {
  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > 2000
  ) {
    return false;
  }

  const validMessages = messages.every(
    (message) =>
      message &&
      typeof message.id === "string" &&
      message.id.trim().length > 0 &&
      ["user", "model"].includes(message.role) &&
      typeof message.text === "string" &&
      message.text.trim().length > 0 &&
      message.text.length <= 100000
  );

  if (!validMessages) return false;

  // Prevent oversized MongoDB documents
  const size = Buffer.byteLength(
    JSON.stringify(messages),
    "utf8"
  );

  return size <= 12 * 1024 * 1024;
}

// Handle controller errors
function handleError(res, error, message) {
  console.error(message, error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      error: "Invalid chat data.",
    });
  }

  return res.status(500).json({
    error: message,
  });
}


// ========================================
// 1. GET ALL CHATS
// ========================================

export async function getChats(req, res) {
  try {
    const chats = await Chat.find()
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json(
      chats.map(formatChat)
    );

  } catch (error) {
    return handleError(
      res,
      error,
      "Failed to fetch chat history."
    );
  }
}


// ========================================
// 2. CREATE OR UPDATE CHAT
// ========================================

export async function saveChat(req, res) {
  try {
    const { chatId } = req.params;
    const { title, messages } = req.body;

    // Validate chat title
    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 100
    ) {
      return res.status(400).json({
        error: "Invalid chat title.",
      });
    }

    // Validate conversation messages
    if (!areMessagesValid(messages)) {
      return res.status(400).json({
        error: "Invalid conversation messages.",
      });
    }

    // Create or update the conversation
    const chat = await Chat.findOneAndUpdate(
      { chatId },
      {
        $set: {
          title: title.trim(),
          messages,
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json(
      formatChat(chat)
    );

  } catch (error) {
    return handleError(
      res,
      error,
      "Failed to save chat."
    );
  }
}

// ========================================
// 3. DELETE CHAT
// ========================================

export async function deleteChat(req, res) {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOneAndDelete({
      chatId,
    });

    if (!chat) {
      return res.status(404).json({
        error: "Chat not found.",
      });
    }

    return res.status(200).json({
      message: "Chat deleted successfully.",
    });

  } catch (error) {
    return handleError(
      res,
      error,
      "Failed to delete chat."
    );
  }
}
