"use client";

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
        className={`max-w-[70%] py-3 px-4 rounded-xl leading-relaxed break-words whitespace-pre-wrap ${
          isUser
            ? "bg-brand-500 text-white rounded-br-sm"
            : "bg-surface-elevated text-text-primary rounded-bl-sm shadow-sm"
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
        {content && <span>{content}</span>}
      </div>
    </div>
  );
}
