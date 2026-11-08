import express from "express";

import { getChats, saveChat, deleteChat } from "../controllers/chatController.js";

const chatRouter = express.Router();

// GET all conversations
chatRouter.get("/", getChats);

// CREATE or UPDATE a conversation
chatRouter.put("/:chatId", saveChat);

// DELETE a conversation
chatRouter.delete("/:chatId", deleteChat);

export default chatRouter;