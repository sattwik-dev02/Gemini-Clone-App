import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { connectDB } from "./config/dbConnect.js";
import chatRouter from "./routes/chatRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

app.use(
    cors({
        origin: process.env.CLIENT_ORIGIN,
    })
);

app.use(express.json({ limit: "12mb" }));

app.get("/api/health", (req, res) => {
    res.json({ status: "OK" });
});

app.use("/api/chats", chatRouter);

app.post("/api/chat", async (req, res) => {
    try {
        const { messages } = req.body;

        if (
            !Array.isArray(messages) ||
            messages.length === 0 ||
            messages.length > 40 ||
            messages.some(
                (message) =>
                    !["user", "model"].includes(message.role) ||
                    typeof message.text !== "string" ||
                    !message.text.trim() ||
                    message.text.length > 8000
            ) ||
            messages[messages.length - 1].role !== "user"
        ) {
            return res.status(400).json({
                error: "Invalid conversation messages.",
            });
        }

        const contents = messages.map((message) => ({
            role: message.role,
            parts: [{ text: message.text }],
        }));

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL,
            contents,
            config: {
                systemInstruction:
                    "You are a helpful and friendly AI assistant. " +
                    "Give clear, accurate, well-structured answers.",
            },
        });

        res.json({
            reply: response.text || "No response generated.",
        });
    } catch (error) {
        console.error("Gemini API error:", error);

        const status =
            error.status === 429 ? 429 : 500;

        res.status(status).json({
            error:
                status === 429
                    ? "Gemini rate limit reached. Try again later."
                    : "Unable to generate a response.",
        });
    }
});

// stream ai response endpoint
app.post("/api/chat/stream", async (req, res) => {
    const { messages } = req.body ?? {};

    // 1. Validate conversation input
    if (
        !Array.isArray(messages) ||
        messages.length === 0 ||
        messages.length > 40 ||
        messages.some(
            (message) =>
                !["user", "model"].includes(message.role) ||
                typeof message.text !== "string" ||
                !message.text.trim() ||
                message.text.length > 8000
        ) ||
        messages[messages.length - 1].role !== "user"
    ) {
        return res.status(400).json({
            error: "Invalid conversation messages.",
        });
    }

    // 2. Convert messages to Gemini's format
    const contents = messages.map((message) => ({
        role: message.role,
        parts: [{ text: message.text }],
    }));

    let started = false;
    let disconnected = false;

    res.on("close", () => {
        if (!res.writableFinished) {
            disconnected = true;
        }
    });

    try {
        // 3. Request streamed output from Gemini
        const stream = await ai.models.generateContentStream({
            model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
            contents,
            config: {
                systemInstruction:
                    "You are a helpful AI assistant. " +
                    "Use relevant emojis naturally in your responses to make conversations more friendly and engaging. " +
                    "Avoid using too many emojis. " +
                    "Keep technical explanations professional and readable, with less emojis.",
            },
            // thinkingConfig: {
            //     thinkingLevel: "minimal",
            // },
        });

        // 4. Set response headers for text streaming
        res.setHeader(
            "Content-Type",
            "text/plain; charset=utf-8"
        );
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("X-Content-Type-Options", "nosniff");

        // 5. Read and forward chunks
        for await (const chunk of stream) {
            if (disconnected) break;

            const text = chunk.text;

            if (!text) continue;

            if (!started) {
                res.flushHeaders();
                started = true;
            }

            res.write(text);
        }

        // 6. Finish the HTTP response
        if (!disconnected && !res.writableEnded) {
            if (!started) {
                res.status(502).json({
                    error: "Gemini returned no text.",
                });
            } else {
                res.end();
            }
        }
    } catch (error) {
        console.error("Streaming error:", error);

        if (disconnected || res.writableEnded) return;

        // If a stream has already begun, its HTTP status
        // cannot be changed.
        if (res.headersSent) {
            res.destroy(error);
            return;
        }

        const status = error.status === 429 ? 429 : 500;

        res.status(status).json({
            error:
                status === 429
                    ? "Gemini rate limit reached."
                    : "Unable to stream the AI response.",
        });
    }
});

connectDB();

app.listen(PORT, () => {
    console.log(`Backend running on port: ${PORT}`);
});
