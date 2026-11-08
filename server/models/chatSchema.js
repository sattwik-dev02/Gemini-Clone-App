import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },

    text: {
      type: String,
      required: true,
      maxlength: 100000,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    // Matches the UUID generated in React
    chatId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    messages: {
      type: [messageSchema],
      default: [],
    },
  }, { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;