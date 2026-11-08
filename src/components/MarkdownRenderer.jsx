import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";

export default function MarkdownRenderer({ content }) {
  return (
    <div
      className="min-w-0 break-words
      text-[15px] leading-7 text-gray-200"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          // Headings
          h1: ({ children }) => (
            <h1
              className="mb-4 mt-6 text-2xl
              font-bold text-white"
            >
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2
              className="mb-3 mt-5 text-xl
              font-semibold text-white"
            >
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3
              className="mb-2 mt-4 text-lg
              font-semibold text-white"
            >
              {children}
            </h3>
          ),

          // Paragraph
          p: ({ children }) => <p className="mb-4 leading-7">{children}</p>,

          // Bold
          strong: ({ children }) => (
            <strong
              className="font-semibold
              text-white"
            >
              {children}
            </strong>
          ),

          // Italic
          em: ({ children }) => (
            <em className="italic text-gray-300">{children}</em>
          ),

          // Lists
          ul: ({ children }) => (
            <ul
              className="mb-4 list-disc
              space-y-2 pl-6"
            >
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol
              className="mb-4 list-decimal
              space-y-2 pl-6"
            >
              {children}
            </ol>
          ),

          li: ({ children }) => <li className="pl-1">{children}</li>,

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline
                underline-offset-4 hover:text-blue-300"
            >
              {children}
            </a>
          ),

          // Inline code
          code: ({ children, className }) => (
            <code
              className={`${className || ""}
                rounded bg-[#303134] px-1.5
                py-0.5 font-mono text-[13px]
                text-pink-300`}
            >
              {children}
            </code>
          ),

          // Fenced code blocks
          pre: ({ children }) => {
            const codeElement = Array.isArray(children)
              ? children[0]
              : children;

            const className = codeElement?.props?.className || "";

            const match = /language-([\w+#.-]+)/.exec(className);

            const code = String(codeElement?.props?.children ?? "").replace(
              /\n$/,
              "",
            );

            return <CodeBlock language={match?.[1] || "text"} code={code} />;
          },

          // Tables
          table: ({ children }) => (
            <div
              className="my-4 w-full
              overflow-x-auto rounded-lg
              border border-white/10"
            >
              <table
                className="w-full
                border-collapse text-left text-sm"
              >
                {children}
              </table>
            </div>
          ),

          th: ({ children }) => (
            <th
              className="border-b
              border-white/20 bg-[#303134]
              px-4 py-3 font-semibold
              text-white"
            >
              {children}
            </th>
          ),

          td: ({ children }) => (
            <td
              className="border-b
              border-white/10 px-4 py-3"
            >
              {children}
            </td>
          ),

          // Quotes
          blockquote: ({ children }) => (
            <blockquote
              className="my-4
              border-l-4 border-blue-400
              bg-white/5 py-2 pl-4
              italic text-gray-300"
            >
              {children}
            </blockquote>
          ),

          // Horizontal lines
          hr: () => (
            <hr
              className="my-6
              border-white/20"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
