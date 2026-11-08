
import { useEffect, useRef } from "react";
import { Sparkles, UserRound } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

const suggestions = [
    "Explain React hooks and its types with example.",
    "Help me prepare for a Java interview.",
    "Write a creative short story.",
    "Explain how the internet works?",
];

export default function ChatWindow({ messages, loading, onSuggestion }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, loading]);

    if (messages.length === 0) {
        return (
            <div className="mx-auto flex h-full
        max-w-3xl flex-col justify-center px-2"
            >
                <h1 className="mb-3 bg-gradient-to-r
          from-blue-400 via-purple-400 to-pink-400
          bg-clip-text text-4xl font-semibold
          text-transparent sm:text-5xl">
                    Hello, there.
                </h1>

                <h2 className="mb-12 text-3xl font-medium
          text-gray-500 sm:text-4xl">
                    How can I help you today?
                </h2>

                <div className="grid grid-cols-1 gap-3
          sm:grid-cols-2">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() => onSuggestion(suggestion)}
                            className="min-h-28 rounded-2xl
              bg-[#282a2c] p-5 text-left
              text-sm text-gray-200
              transition hover:bg-[#35373a]"
                        >
                            <Sparkles
                                size={20}
                                className="mb-4 text-blue-400"
                            />
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-8 py-6">
            {messages.map((message) => (
                <div key={message.id}
                    className="flex items-start gap-4"
                >
                    <div
                        className={`flex h-9 w-9 shrink-0
              items-center justify-center rounded-full
              ${message.role === "user"
                                ? "bg-[#39445b]"
                                : "bg-gradient-to-br from-blue-500 to-purple-500"
                            }`}
                    >
                        {message.role === "user" ? (
                            <UserRound size={19} />
                        ) : (
                            <Sparkles size={19} />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="mb-2 text-sm font-semibold
              text-gray-300">
                            {message.role === "user" ? "You" : "AI"}
                        </p>

                        {message.role === "model" ? (
                            <MarkdownRenderer content={message.text} />
                        ) : (
                            <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-gray-200">
                                {message.text}
                            </p>
                        )}
                        {loading &&
                            message.role === "model" &&
                            message.id === messages.at(-1)?.id &&
                            message.text && (
                                <span
                                    className="ml-1 inline-block h-4 w-1.5
                                    animate-pulse rounded-sm bg-blue-400"
                                    aria-label="Generating response"
                                />
                            )}
                    </div>
                </div>
            ))}

            {loading && !messages.at(-1)?.text && (
                <div className="flex items-center gap-3
                    text-sm text-blue-300">
                    <Sparkles
                        size={20}
                        className="animate-pulse"
                    />
                    Gemini is thinking...
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
}
