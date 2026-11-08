import { useState } from "react";
import { ArrowUp, Square } from "lucide-react";

export default function ChatInput({ onSend, onStop, loading }) {
  const [input, setInput] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const text = input.trim();

    if (!text || loading) return;

    onSend(text);
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
      <div
        className="flex items-end gap-3 rounded-3xl
        bg-[#282a2c] p-4"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Gemini-inspired AI..."
          rows={2}
          maxLength={8000}
          className="max-h-40 min-h-12 flex-1
          resize-none bg-transparent text-white
          outline-none placeholder:text-gray-400"
        />

        {loading ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            title="Stop generating"
            className="rounded-full bg-gray-200
            p-3 text-gray-900 transition hover:bg-white"
          >
            <Square size={18} fill="currentColor" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Send message"
            className="rounded-full bg-[#a8c7fa]
            p-3 text-[#1e1f20] transition hover:bg-[#c2d7fb]
            disabled:cursor-not-allowed
            disabled:opacity-40"
          >
            <ArrowUp size={20} />
          </button>
        )}
      </div>

      <p
        className="mt-3 text-center text-xs
        text-gray-500"
      >
        AI can make mistakes. Verify important information.
      </p>
    </form>
  );
}
