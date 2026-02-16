"use client";

import ReactMarkdown from "react-markdown";

export default function ChatMessage({ role, content, images = [] }) {
  const isUser = role === "user";

  return (
    <div
      className={`mb-4 flex gap-3 animate-slide-in items-center ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
          isUser
            ? "bg-brand-500 text-white"
            : "bg-surface-elevated text-text-secondary"
        }`}
      >
        {isUser ? "You" : "AI"}
      </div>
      <div
        className={`max-w-[70%] py-3 px-4 rounded-xl leading-relaxed break-words ${
          isUser
            ? "bg-brand-500 text-white rounded-br-sm whitespace-pre-wrap"
            : "bg-surface-elevated text-text-primary rounded-bl-sm shadow-sm markdown-body"
        }`}
      >
        {images.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {images.map((src, index) => (
              <img
                key={index}
                src={src}
                alt="Attached"
                className="max-w-[200px] max-h-[150px] rounded-lg cursor-pointer transition-opacity hover:opacity-90"
                onClick={() => window.open(src, "_blank")}
              />
            ))}
          </div>
        )}
        {content &&
          (isUser ? (
            <span>{content}</span>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                code: ({ inline, children }) =>
                  inline ? (
                    <code className="bg-black/10 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                  ) : (
                    <code className="block bg-black/10 p-3 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre mb-2">{children}</code>
                  ),
                pre: ({ children }) => <pre className="mb-2 last:mb-0">{children}</pre>,
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mb-1.5">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="underline opacity-80 hover:opacity-100">
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-current/30 pl-3 opacity-80 mb-2">{children}</blockquote>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          ))}
      </div>
    </div>
  );
}
