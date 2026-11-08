import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";

export default function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const displayLanguage = language || "text";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy:", error);
      setCopied(false);
    }
  }

  return (
    <div
      className="my-4 min-w-0 overflow-hidden
      rounded-xl border border-white/10 bg-[#282c34]"
    >
      {/* Code header */}
      <div
        className="flex items-center
        justify-between border-b border-white/10
        bg-[#202329] px-4 py-2"
      >
        <span
          className="text-xs font-medium
          text-gray-300"
        >
          {displayLanguage}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2
          rounded-md px-2 py-1 text-xs
          text-gray-300 transition
          hover:bg-white/10 hover:text-white"
        >
          {copied ? (
            <>
              <Check size={14} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy code
            </>
          )}
        </button>
      </div>

      {/* Highlighted code */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language || "text"}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "16px",
            background: "transparent",
            fontSize: "13px",
            lineHeight: "1.7",
          }}
          wrapLongLines={false}
          showLineNumbers={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
