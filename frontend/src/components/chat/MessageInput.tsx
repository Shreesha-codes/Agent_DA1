"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export function MessageInput({ onSendMessage, disabled, placeholder = "Ask a question about your dataset..." }: MessageInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative border border-black bg-white px-3 py-2.5">
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="w-full resize-none bg-transparent font-body text-xs text-black placeholder-black/30 outline-none disabled:opacity-50 pr-12 min-h-[22px] max-h-[180px] overflow-y-auto"
      />

      <div className="absolute right-2.5 bottom-2.5 flex items-center gap-2">
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="flex h-6 w-6 items-center justify-center bg-black text-white border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:hover:bg-black disabled:hover:text-white"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      </div>
    </form>
  );
}
