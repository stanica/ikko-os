"use client";

import { useState, useRef } from "react";
import { Paperclip } from "lucide-react";

export default function ChatInput({ onSend, disabled }) {
  const [message, setMessage] = useState("");
  const [images, setImages] = useState([]);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSend = () => {
    if (disabled || (!message.trim() && images.length === 0)) return;

    onSend(message.trim(), images);
    setMessage("");
    setImages([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImages((prev) => [...prev, event.target.result]);
        };
        reader.readAsDataURL(file);
      }
    });

    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-5 bg-surface border-t border-border">
      {images.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {images.map((src, index) => (
            <div
              key={index}
              className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600"
            >
              <img
                src={src}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white border-none rounded-full cursor-pointer text-xs flex items-center justify-center p-0 hover:bg-black/90"
                onClick={() => removeImage(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-3 items-end">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
        {/* <button
          className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-none rounded-xl text-xl cursor-pointer transition-all flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={() => fileInputRef.current?.click()}
          title="Upload image"
        >
          <Paperclip size={20} />
        </button> */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          maxLength={2000}
          className="flex-1 py-3 px-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl text-base font-inherit resize-none outline-none transition-colors max-h-30 focus:border-brand-500 dark:focus:border-brand-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        <button
          className="py-3 px-6 bg-brand-500 text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-all hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-lg active:not-disabled:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSend}
          disabled={disabled || (!message.trim() && images.length === 0)}
        >
          Send
        </button>
      </div>
    </div>
  );
}
